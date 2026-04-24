const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

// Load env from backend/.env explicitly (tasks/PM2 may start from repo root)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-frontend-domain.com';
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    FRONTEND_URL
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (no Origin header)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-admin-token']
}));
app.use(express.json());

// Heritage API Endpoints
app.get('/', (req, res) => res.json({ status: 'Heritage API Live' }));

let db;

const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
    const token = req.header('x-admin-token');
    if (!ADMIN_TOKEN) {
        return res.status(500).json({ error: 'Admin auth not configured' });
    }
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        jwt.verify(token, ADMIN_TOKEN);
        next();
    } catch(e) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

async function setupDb() {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    
    await db.run("PRAGMA foreign_keys = ON;"); // [Fix 1.4] Enforce FK constraints
    await db.run("PRAGMA journal_mode = WAL;"); // [Fix 2.1] Enable WAL mode

    await db.exec(`
        -- Topic 2: Data Types (VARCHAR instead of TEXT)
        CREATE TABLE IF NOT EXISTS menu (
            id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price INTEGER NOT NULL,
            category VARCHAR(100),
            type VARCHAR(20),
            imageUrl TEXT,
            isSpecial INTEGER DEFAULT 0,
            timeHash INTEGER NOT NULL
        );
        
        -- Topic 7: Database Modeling (Splitting orders from their items)
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            total INTEGER NOT NULL,
            method VARCHAR(50) NOT NULL,
            time DATETIME DEFAULT CURRENT_TIMESTAMP,
            timeHash INTEGER NOT NULL
        );
        
        -- Topic 7: Foreign Keys (ON DELETE CASCADE)
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY,
            order_id INTEGER NOT NULL,
            menu_name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            price_at_time INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(50) PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS daily_summaries (
            id INTEGER PRIMARY KEY,
            date TEXT NOT NULL UNIQUE,
            total_revenue INTEGER NOT NULL,
            order_count INTEGER NOT NULL,
            orders_json TEXT NOT NULL
        );
    `);

    // Ensure config exists
    const row = await db.get("SELECT * FROM settings WHERE key = 'config'");
    if (!row) {
        await db.run("INSERT INTO settings (key, value) VALUES ('config', ?)", [JSON.stringify({ownerQr: ''})]);
    }
}

// Ensure isSpecial column exists (for databases created before this change)
async function addSpecialColumnIfMissing() {
    try {
        await db.run("ALTER TABLE menu ADD COLUMN isSpecial INTEGER DEFAULT 0");
    } catch (e) {
        if (!e.message.includes('duplicate column')) console.error('Migration error:', e); // [Fix 2.3] Filter duplicate column errors
    }
}

// Default menu items — kept in sync with frontend menuList.js
const fs = require('fs');
let initialMenu = [];
try {
    const menuPath = path.join(__dirname, '../src/menuList.js');
    const content = fs.readFileSync(menuPath, 'utf-8');
    const match = content.match(/export const initialMenu = (\[[\s\S]*\]);/);
    if (match) {
        initialMenu = new Function("return " + match[1])();
    }
} catch (e) {
    console.error("Failed to load initialMenu from frontend:", e);
}

// Seed (refresh) the menu table: clear existing rows, re-insert defaults
async function seedMenu() {
    console.log('Seeding database with default menu items...');
    await db.run('BEGIN TRANSACTION');
    try {
        await db.run("DELETE FROM menu");
        for (const item of initialMenu) {
            await db.run(
                "INSERT INTO menu (name, price, category, type, imageUrl, timeHash) VALUES (?, ?, ?, ?, ?, ?)",
                [item.name, item.price, item.category, item.type, item.imageUrl, Date.now()]
            );
        }
        await db.run('COMMIT');
        console.log(`Seeded ${initialMenu.length} menu items.`);
    } catch (e) {
        await db.run('ROLLBACK');
        console.error('Seed failed:', e.message);
        throw e;
    }
}

// API endpoint so the frontend can also trigger a seed/refresh
app.post('/api/seed', requireAdmin, async (req, res) => { // [Fix 1.2] Add requireAdmin
    try {
        await seedMenu();
        const menu = await db.all("SELECT * FROM menu");
        res.json({ success: true, count: menu.length, menu });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


function parseInteger(value) {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isInteger(Number(value))) return Number(value);
    return null;
}

// [Fix 1.3] New auth route
const bcrypt = require('bcrypt');

app.post('/api/auth/login', async (req, res) => {
    try {
        const { password } = req.body;
        // Hardcoded bcrypt hash of 'owner123'. 
        const storedHash = process.env.OWNER_HASH || "$2b$10$w8.1Uqz.f3m1c7ZRyR/sDO3r9c8s1Q6/GZ.00t4r0A8A9T1Q3O88O";
        const isMatch = await bcrypt.compare(password, storedHash);
        
        if (!isMatch) return res.status(401).json({ error: 'Invalid password' });
        
        const token = jwt.sign({ role: 'admin' }, ADMIN_TOKEN, { expiresIn: '1d' });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const menu = await db.all("SELECT * FROM menu");

        // Fetch orders + their items with a single LEFT JOIN (avoid N+1).
        const rows = await db.all(`
            SELECT
                o.id AS id,
                o.total AS total,
                o.method AS method,
                o.time AS time,
                o.timeHash AS timeHash,
                oi.menu_name AS name,
                oi.quantity AS qty,
                oi.price_at_time AS price
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            ORDER BY o.timeHash DESC
        `);

        const ordersById = new Map();
        for (const row of rows) {
            if (!ordersById.has(row.id)) {
                ordersById.set(row.id, {
                    id: row.id,
                    total: row.total,
                    method: row.method,
                    time: row.time,
                    timeHash: row.timeHash,
                    items: []
                });
            }

            if (row.name) {
                ordersById.get(row.id).items.push({
                    name: row.name,
                    qty: row.qty,
                    price: row.price
                });
            }
        }

        const orders = Array.from(ordersById.values());

        const dailySummaries = await db.all("SELECT * FROM daily_summaries ORDER BY id DESC");

        const settingsRow = await db.get("SELECT * FROM settings WHERE key = 'config'");
        let settings = { ownerQr: '' };
        if (settingsRow) {
            try {
                settings = JSON.parse(settingsRow.value);
            } catch {
                settings = { ownerQr: '' };
            }
        }
        
        const dailySpecialRow = await db.get("SELECT * FROM settings WHERE key = 'daily_special'");
        let dailySpecial = null;
        if (dailySpecialRow) {
            try {
                dailySpecial = JSON.parse(dailySpecialRow.value);
            } catch {}
        }

        res.json({ menu, orders, dailySummaries, settings, dailySpecial });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/menu', async (req, res) => {
    try {
        const { name, price, category, type, imageUrl, timeHash } = req.body || {};
        if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 255) {
            return res.status(400).json({ error: 'Invalid menu item name' });
        }
        
        // [Fix 2.4] Validate category and type
        const allowedTypes = ['veg', 'non-veg', 'nonveg'];
        const normalizedType = typeof type === 'string' ? type.trim().toLowerCase() : 'veg';
        if (!allowedTypes.includes(normalizedType)) {
            return res.status(422).json({ error: 'Invalid type field' });
        }
        const allowedCategories = ['CURRIES', 'BREADS', 'BIRYANI', 'FRIED RICE', 'STARTERS', 'DESSERTS', 'DRINKS']; // Existing list
        if (!category || !allowedCategories.includes(category)) {
            return res.status(422).json({ error: 'Invalid category field' });
        }

        const parsedPrice = parseInteger(price);
        const parsedTimeHash = parseInteger(timeHash);
        if (parsedPrice === null || parsedPrice <= 0) {
            return res.status(400).json({ error: 'Invalid menu item price' });
        }
        if (parsedTimeHash === null) {
            return res.status(400).json({ error: 'Invalid timeHash' });
        }

        const result = await db.run(
            "INSERT INTO menu (name, price, category, type, imageUrl, timeHash) VALUES (?, ?, ?, ?, ?, ?)",
            [name.trim(), parsedPrice, category || '', type || 'veg', imageUrl || '', parsedTimeHash]
        );
        const newItem = await db.get("SELECT * FROM menu WHERE id = ?", [result.lastID]);
        res.json(newItem);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/menu/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInteger(req.params.id);
        if (id === null) return res.status(400).json({ error: 'Invalid id' });
        await db.run("DELETE FROM menu WHERE id = ?", [id]);
        res.json({ success: true, id });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { items, total, method, time, timeHash } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'items must be a non-empty array' });
        }

        const parsedTotal = parseInteger(total);
        const parsedTimeHash = parseInteger(timeHash);
        if (parsedTotal === null || parsedTotal < 0) {
            return res.status(400).json({ error: 'Invalid total' });
        }
        if (typeof method !== 'string' || method.trim().length === 0 || method.trim().length > 50) {
            return res.status(400).json({ error: 'Invalid method' });
        }
        if (parsedTimeHash === null) {
            return res.status(400).json({ error: 'Invalid timeHash' });
        }

        const normalizedItems = [];
        let serverCalculatedTotal = 0; // [Fix 1.1] Recalculate total server-side
        
        for (let item of items) {
            const itemId = parseInteger(item?.id);
            const itemName = typeof item?.name === 'string' ? item.name.trim() : '';
            const qty = parseInteger(item?.quantity);
            // [Fix 1.5] Enforce quantity max 99
            if (!itemName || itemName.length > 255 || qty === null || qty <= 0 || qty > 99) { 
                return res.status(422).json({ error: 'Invalid item payload' });
            }
            
            // [Fix 1.1] lookup price from db securely using item ID or name
            const dbItem = itemId ? 
                await db.get("SELECT price FROM menu WHERE id = ?", [itemId]) :
                await db.get("SELECT price FROM menu WHERE name = ?", [itemName]);
                
            if (!dbItem) {
                return res.status(400).json({ error: 'Item does not exist in menu' });
            }
            const actualPrice = dbItem.price;
            serverCalculatedTotal += (actualPrice * qty);
            
            normalizedItems.push({ name: itemName, quantity: qty, price: actualPrice, id: itemId });
        }
        
        // Topic 9: Transactions (BEGIN and COMMIT) ensuring atomicity
        try {
            await db.run('BEGIN TRANSACTION');
            
            const result = await db.run(
                "INSERT INTO orders (total, method, time, timeHash) VALUES (?, ?, ?, ?)",
                [serverCalculatedTotal, method.trim(), time, parsedTimeHash] // [Fix 1.1] Use `serverCalculatedTotal` safely
            );
            const orderId = result.lastID;
            
            for (let item of normalizedItems) {
                await db.run(
                    "INSERT INTO order_items (order_id, menu_name, quantity, price_at_time) VALUES (?, ?, ?, ?)",
                    [orderId, item.name, item.quantity, item.price]
                );
            }
            
            await db.run('COMMIT');
            
            const newOrder = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
            const orderItems = await db.all("SELECT menu_name AS name, quantity AS qty, price_at_time AS price FROM order_items WHERE order_id = ?", [orderId]);
            newOrder.items = orderItems;
            
            res.json(newOrder);
        } catch(transactionError) {
            await db.run('ROLLBACK');
            throw transactionError; // Pass to the outer catch handler
        }
    } catch(e) {
        if (e.message === 'Invalid item payload') {
            return res.status(400).json({ error: e.message });
        }
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/end-day', requireAdmin, async (req, res) => {
    try {
        const orders = await db.all("SELECT * FROM orders");
        if (orders.length === 0) {
            return res.status(400).json({ error: 'No active orders to summarize' });
        }

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const orderCount = orders.length;

        // Fetch detailed items for the summary
        const allItems = await db.all(`
            SELECT o.id AS order_id, oi.menu_name, oi.quantity, oi.price_at_time
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
        `);

        // [Fix 2.2] Store formatted IST date string instead of UTC
        const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const summaryData = {
            total: totalRevenue,
            count: orderCount,
            date: dateStr,
            orders: orders.map(o => ({
                ...o,
                items: allItems.filter(i => i.order_id === o.id)
            }))
        };

        await db.run('BEGIN TRANSACTION');
        try {
            await db.run(
                "INSERT OR REPLACE INTO daily_summaries (date, total_revenue, order_count, orders_json) VALUES (?, ?, ?, ?)",
                [dateStr, totalRevenue, orderCount, JSON.stringify(summaryData)]
            );
            await db.run("DELETE FROM orders"); // Cascades to order_items
            
            // Remove the daily special at the end of the day
            await db.run("DELETE FROM menu WHERE isSpecial = 1 OR category = 'TODAY''S SPECIAL'");
            await db.run("DELETE FROM settings WHERE key = 'daily_special'");

            await db.run('COMMIT');
            res.json({ success: true, summary: summaryData });
        } catch(e) {
            await db.run('ROLLBACK');
            throw e;
        }
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/settings', requireAdmin, async (req, res) => {
    try {
        const newSettings = req.body || {};
        const ownerQr = newSettings.ownerQr;
        if (typeof ownerQr !== 'string' || ownerQr.length > 2048) {
            return res.status(400).json({ error: 'Invalid ownerQr' });
        }

        const sanitizedSettings = { ownerQr };
        await db.run(
            "UPDATE settings SET value = ? WHERE key = 'config'",
            [JSON.stringify(sanitizedSettings)]
        );
        res.json(sanitizedSettings);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/generate-special', requireAdmin, async (req, res) => {
    try {
        const { name, imageUrl, price, type } = req.body || {};
        if (typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid special item name' });
        }
        const parsedPrice = parseInteger(price);
        if (parsedPrice === null || parsedPrice <= 0) {
            return res.status(400).json({ error: 'A valid price is required for the special item' });
        }

        // Check if this item already exists in the regular menu
        const existingItem = await db.get(
            "SELECT * FROM menu WHERE LOWER(name) = LOWER(?) AND isSpecial = 0",
            [name.trim()]
        );

        // Determine the final image URL: use provided one, fall back to existing menu item's image
        let finalImageUrl = '';
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
            finalImageUrl = imageUrl.trim();
        } else if (existingItem && existingItem.imageUrl) {
            finalImageUrl = existingItem.imageUrl;
        } else {
            return res.status(400).json({ error: 'Image URL is required for items not already in the menu' });
        }

        const specialObj = { text: name.trim(), imageUrl: finalImageUrl };

        await db.run('BEGIN TRANSACTION');
        try {
            // Remove any previously marked special items from the menu
            await db.run("DELETE FROM menu WHERE isSpecial = 1");

            // Insert the new special as a real menu item so customers can order it
            const result = await db.run(
                "INSERT INTO menu (name, price, category, type, imageUrl, isSpecial, timeHash) VALUES (?, ?, ?, ?, ?, 1, ?)",
                [name.trim(), parsedPrice, "TODAY'S SPECIAL", type || (existingItem?.type || 'veg'), finalImageUrl, Date.now()]
            );

            // Also save to settings so the banner can show it
            await db.run(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_special', ?)",
                [JSON.stringify({ ...specialObj, menuId: result.lastID })]
            );

            await db.run('COMMIT');
        } catch(e) {
            await db.run('ROLLBACK');
            throw e;
        }

        res.json(specialObj);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Remove daily special
app.delete('/api/daily-special', requireAdmin, async (req, res) => {
    try {
        await db.run('BEGIN TRANSACTION');
        try {
            await db.run("DELETE FROM menu WHERE isSpecial = 1");
            await db.run("DELETE FROM settings WHERE key = 'daily_special'");
            await db.run('COMMIT');
            res.json({ success: true });
        } catch(e) {
            await db.run('ROLLBACK');
            throw e;
        }
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
setupDb().then(async () => {
    await addSpecialColumnIfMissing();
    // Auto-seed menu every time the server starts
    await seedMenu();
    app.listen(PORT, () => console.log(`Backend API live on http://localhost:${PORT}`));
});
