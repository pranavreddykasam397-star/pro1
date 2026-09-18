const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env from backend/.env explicitly
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const {
    connectMongoDB,
    seedMongoDB,
    Menu,
    Order,
    Setting,
    Customer,
    Owner,
    DailySummary
} = require('./mongodb');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'super_secret_admin_token_123';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://pro1-chi-sable.vercel.app';
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://pro1-chi-sable.vercel.app',
    'https://heritage-niat.vercel.app',
    FRONTEND_URL
].filter(Boolean);

const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || uniqueOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'x-admin-token'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.json({ status: 'Heritage API Live (MongoDB Powered)' }));

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

function requireAdmin(req, res, next) {
    const token = req.header('x-admin-token');
    if (!ADMIN_TOKEN) {
        return res.status(500).json({ error: 'Admin auth not configured' });
    }
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    try {
        jwt.verify(token, ADMIN_TOKEN);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function isValidUrl(string) {
    if (!string) return true;
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:';
    } catch (_) {
        return false;
    }
}

function parseInteger(value) {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isInteger(Number(value))) return Number(value);
    return null;
}

const fs = require('fs');
let initialMenu = [];
try {
    const menuPath = path.join(__dirname, 'menuData.json');
    const content = fs.readFileSync(menuPath, 'utf-8');
    initialMenu = JSON.parse(content);
} catch (e) {
    console.error("Failed to load initialMenu from menuData.json:", e);
}

async function seedMenu() {
    console.log('Seeding MongoDB with default menu items...');
    await Menu.deleteMany({});
    const docs = initialMenu.map((item, idx) => ({
        id: item.id || idx + 1,
        name: item.name,
        price: item.price,
        category: item.category,
        type: item.type,
        imageUrl: item.imageUrl,
        isSpecial: item.isSpecial ? true : false,
        timeHash: Date.now()
    }));
    await Menu.insertMany(docs);
    console.log(`Seeded ${docs.length} menu items into MongoDB.`);
}

app.post('/api/seed', requireAdmin, async (req, res) => {
    try {
        await seedMenu();
        const menu = await Menu.find().lean();
        res.json({ success: true, count: menu.length, menu });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const otpStore = {};

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const superAdminNumber = '9392767835';
        
        otpStore[superAdminNumber] = otp;
        
        console.log(`\n======================================================`);
        console.log(`📱 SMS INITIATED`);
        console.log(`To: ${superAdminNumber}`);
        console.log(`Message: Your owner registration OTP is ${otp}`);
        console.log(`======================================================\n`);

        try {
            const https = require('https');
            const postData = JSON.stringify({
                phone: '919392767835',
                message: `Your Heritage owner registration OTP is: ${otp}`,
                key: 'textbelt',
            });

            const reqOptions = {
                hostname: 'textbelt.com',
                port: 443,
                path: '/text',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const smsData = await new Promise((resolve, reject) => {
                const smsReq = https.request(reqOptions, (smsRes) => {
                    let body = '';
                    smsRes.on('data', d => body += d);
                    smsRes.on('end', () => {
                        try { resolve(JSON.parse(body)); } catch(e) { resolve({success:false, error: 'parse error'}); }
                    });
                });
                smsReq.on('error', e => reject(e));
                smsReq.write(postData);
                smsReq.end();
            });

            if (smsData.success) {
                console.log('✅ SMS successfully sent via Textbelt!');
                return res.json({ success: true, message: 'OTP sent to your number via SMS' });
            } else {
                console.log('⚠️ Textbelt SMS failed (Quota exceeded?):', smsData.error);
                return res.json({ success: true, message: 'OTP logged to server console (SMS quota exceeded)' });
            }
        } catch (smsError) {
            console.error('Failed to connect to SMS API:', smsError.message);
            return res.json({ success: true, message: 'OTP logged to server console (SMS service error)' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/auth/dev-otp', (req, res) => {
    const otp = otpStore['9392767835'];
    res.json({ otp: otp || null });
});

app.post('/api/auth/owner-signup', async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        
        if (!email || !password || !otp) {
            return res.status(400).json({ error: 'Email, password, and OTP are required' });
        }

        const superAdminNumber = '9392767835';
        if (otpStore[superAdminNumber] !== otp) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }
        
        delete otpStore[superAdminNumber];

        const existingOwner = await Owner.findOne({ email: email.toLowerCase().trim() });
        if (existingOwner) {
            return res.status(400).json({ error: 'An owner with this email already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        await Owner.create({ email: email.toLowerCase().trim(), password_hash });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const owner = await Owner.findOne({ email: email.toLowerCase().trim() });
        if (!owner) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, owner.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ role: 'admin', email: owner.email }, ADMIN_TOKEN, { expiresIn: '1d' });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Public data endpoint
app.get('/api/data', async (req, res) => {
    try {
        const menu = await Menu.find().lean();
        const settingsRow = await Setting.findOne({ key: 'config' }).lean();
        let settings = { upiId: '' };
        if (settingsRow && settingsRow.value) {
            try {
                const parsed = JSON.parse(settingsRow.value);
                settings.upiId = parsed.upiId || '';
            } catch { }
        }

        const dailySpecialRow = await Setting.findOne({ key: 'daily_special' }).lean();
        let dailySpecial = null;
        if (dailySpecialRow && dailySpecialRow.value) {
            try {
                dailySpecial = JSON.parse(dailySpecialRow.value);
            } catch { }
        }

        res.json({ menu, settings, dailySpecial });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin data endpoint
app.get('/api/admin/data', requireAdmin, async (req, res) => {
    try {
        const menu = await Menu.find().lean();
        const rawOrders = await Order.find().sort({ timeHash: -1 }).lean();

        const orders = rawOrders.map(o => ({
            id: o.id,
            total: o.total,
            method: o.method,
            time: o.time,
            timeHash: o.timeHash,
            customer_id: o.customer_id,
            phone: o.phone || null,
            payment_status: o.payment_status || 'PENDING',
            payment_screenshot: o.payment_screenshot || null,
            items: (o.items || []).map(i => ({
                name: i.menu_name,
                qty: i.quantity,
                price: i.price_at_time
            }))
        }));

        const rawSummaries = await DailySummary.find().sort({ id: -1 }).lean();
        const dailySummaries = rawSummaries.map(s => ({
            id: s.id,
            date: s.date,
            total_revenue: s.total_revenue,
            order_count: s.order_count,
            orders_json: s.orders_json
        }));

        const settingsRow = await Setting.findOne({ key: 'config' }).lean();
        let settings = { ownerQr: '', upiId: '' };
        if (settingsRow && settingsRow.value) {
            try {
                settings = { ...settings, ...JSON.parse(settingsRow.value) };
            } catch {
                settings = { ownerQr: '', upiId: '' };
            }
        }

        const dailySpecialRow = await Setting.findOne({ key: 'daily_special' }).lean();
        let dailySpecial = null;
        if (dailySpecialRow && dailySpecialRow.value) {
            try {
                dailySpecial = JSON.parse(dailySpecialRow.value);
            } catch { }
        }

        res.json({ menu, orders, dailySummaries, settings, dailySpecial });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/menu', requireAdmin, async (req, res) => {
    try {
        const { name, price, category, type, imageUrl, timeHash } = req.body || {};
        if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 255) {
            return res.status(400).json({ error: 'Invalid menu item name' });
        }
        if (imageUrl && !isValidUrl(imageUrl)) {
            return res.status(400).json({ error: 'Invalid imageUrl' });
        }

        const allowedTypes = ['veg', 'non-veg', 'nonveg'];
        const normalizedType = typeof type === 'string' ? type.trim().toLowerCase() : 'veg';
        if (!allowedTypes.includes(normalizedType)) {
            return res.status(422).json({ error: 'Invalid type field' });
        }
        const normalizedCategory = typeof category === 'string' ? category.trim().toUpperCase() : '';
        if (!normalizedCategory) {
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

        const maxItem = await Menu.findOne().sort({ id: -1 }).lean();
        const nextId = maxItem && maxItem.id ? maxItem.id + 1 : 1;

        const newItem = await Menu.create({
            id: nextId,
            name: name.trim(),
            price: parsedPrice,
            category: normalizedCategory,
            type: type || 'veg',
            imageUrl: imageUrl || '',
            timeHash: parsedTimeHash
        });

        res.json(newItem);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/menu/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInteger(req.params.id);
        if (id === null) return res.status(400).json({ error: 'Invalid id' });
        await Menu.deleteOne({ id });
        res.json({ success: true, id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { items, total, method, time, timeHash, customer_id, phone } = req.body || {};

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
        let serverCalculatedTotal = 0;

        for (let item of items) {
            const itemId = parseInteger(item?.id);
            const itemName = typeof item?.name === 'string' ? item.name.trim() : '';
            const qty = parseInteger(item?.quantity);
            if (!itemName || itemName.length > 255 || qty === null || qty <= 0 || qty > 99) {
                return res.status(422).json({ error: 'Invalid item payload' });
            }

            const dbItem = itemId ?
                await Menu.findOne({ id: itemId }).lean() :
                await Menu.findOne({ name: itemName }).lean();

            if (!dbItem) {
                return res.status(400).json({ error: 'Item does not exist in menu' });
            }
            const actualPrice = dbItem.price;
            serverCalculatedTotal += (actualPrice * qty);

            normalizedItems.push({
                menu_name: itemName,
                quantity: qty,
                price_at_time: actualPrice
            });
        }

        const maxOrder = await Order.findOne().sort({ id: -1 }).lean();
        const orderId = maxOrder && maxOrder.id ? maxOrder.id + 1 : 1;
        const paymentStatus = method.trim() === 'COD' ? 'CONFIRMED' : 'PENDING';

        const newOrderDoc = await Order.create({
            id: orderId,
            total: serverCalculatedTotal,
            method: method.trim(),
            time: time ? new Date(time) : new Date(),
            timeHash: parsedTimeHash,
            customer_id: customer_id || null,
            phone: phone || null,
            payment_status: paymentStatus,
            items: normalizedItems
        });

        const orderResponse = {
            id: newOrderDoc.id,
            total: newOrderDoc.total,
            method: newOrderDoc.method,
            time: newOrderDoc.time,
            timeHash: newOrderDoc.timeHash,
            customer_id: newOrderDoc.customer_id,
            phone: newOrderDoc.phone,
            payment_status: newOrderDoc.payment_status,
            items: newOrderDoc.items.map(i => ({ name: i.menu_name, qty: i.quantity, price: i.price_at_time }))
        };

        res.json(orderResponse);
    } catch (e) {
        if (e.message === 'Invalid item payload') {
            return res.status(400).json({ error: e.message });
        }
        res.status(500).json({ error: e.message });
    }
});

app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
    try {
        const id = parseInteger(req.params.id);
        const { status } = req.body || {};
        if (id === null || !['PENDING', 'CONFIRMED', 'REQUEST_SCREENSHOT'].includes(status)) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }
        await Order.updateOne({ id }, { payment_status: status });
        res.json({ success: true, status });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/orders/:id/screenshot', async (req, res) => {
    try {
        const id = parseInteger(req.params.id);
        const { screenshot, customer_id, pin } = req.body || {};
        if (id === null || typeof screenshot !== 'string' || !screenshot.startsWith('data:image')) {
            return res.status(400).json({ error: 'Invalid parameters or screenshot data' });
        }
        if (!customer_id || !pin) {
            return res.status(400).json({ error: 'Customer ID and PIN required' });
        }

        const order = await Order.findOne({ id }).lean();
        if (!order || order.customer_id !== parseInt(customer_id)) {
            return res.status(403).json({ error: 'Order not found or access denied' });
        }

        const customer = await Customer.findOne({ id: parseInt(customer_id) }).lean();
        if (!customer) {
            return res.status(401).json({ error: 'Invalid Customer ID or PIN' });
        }

        const pinMatch = await bcrypt.compare(pin.toString(), customer.pin);
        if (!pinMatch) {
            return res.status(401).json({ error: 'Invalid Customer ID or PIN' });
        }

        await Order.updateOne({ id }, { payment_screenshot: screenshot, payment_status: 'SCREENSHOT_UPLOADED' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/customers/signup', async (req, res) => {
    try {
        const { pin } = req.body || {};
        if (!pin || pin.toString().length !== 4) {
            return res.status(400).json({ error: 'A 4-digit PIN is required' });
        }

        let newId;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            newId = Math.floor(1000 + Math.random() * 9000);
            const existing = await Customer.findOne({ id: newId }).lean();
            if (!existing) isUnique = true;
            attempts++;
        }

        if (!isUnique) return res.status(500).json({ error: 'Failed to generate unique ID' });

        const hashedPin = await bcrypt.hash(pin.toString(), 10);
        await Customer.create({ id: newId, pin: hashedPin });

        res.json({ id: newId, pin: pin.toString() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/customers/history', async (req, res) => {
    try {
        const { id, pin } = req.body || {};
        if (!id || !pin) return res.status(400).json({ error: 'ID and PIN required' });

        const customer = await Customer.findOne({ id: parseInt(id) }).lean();
        if (!customer) {
            return res.status(401).json({ error: 'Invalid ID or PIN' });
        }

        const pinMatch = await bcrypt.compare(pin.toString(), customer.pin);
        if (!pinMatch) {
            return res.status(401).json({ error: 'Invalid ID or PIN' });
        }

        const rawOrders = await Order.find({ customer_id: customer.id }).sort({ timeHash: -1 }).lean();
        const orders = rawOrders.map(o => ({
            id: o.id,
            total: o.total,
            method: o.method,
            time: o.time,
            timeHash: o.timeHash,
            items: (o.items || []).map(i => ({
                name: i.menu_name,
                qty: i.quantity,
                price: i.price_at_time
            }))
        }));

        res.json({ orders });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/customers/:id/orders', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid ID' });

        const customer = await Customer.findOne({ id }).lean();
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const rawOrders = await Order.find({ customer_id: id }).sort({ timeHash: -1 }).lean();
        const orders = rawOrders.map(o => ({
            id: o.id,
            total: o.total,
            method: o.method,
            time: o.time,
            timeHash: o.timeHash,
            items: (o.items || []).map(i => ({
                name: i.menu_name,
                qty: i.quantity,
                price: i.price_at_time
            }))
        }));

        res.json({ orders });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/end-day', requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find().lean();
        if (orders.length === 0) {
            return res.status(400).json({ error: 'No active orders to summarize' });
        }

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const orderCount = orders.length;

        const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const summaryData = {
            total: totalRevenue,
            count: orderCount,
            date: dateStr,
            orders: orders.map(o => ({
                id: o.id,
                total: o.total,
                method: o.method,
                time: o.time,
                timeHash: o.timeHash,
                customer_id: o.customer_id,
                phone: o.phone,
                payment_status: o.payment_status,
                payment_screenshot: o.payment_screenshot,
                items: (o.items || []).map(i => ({ menu_name: i.menu_name, quantity: i.quantity, price_at_time: i.price_at_time }))
            }))
        };

        const maxSummary = await DailySummary.findOne().sort({ id: -1 }).lean();
        const summaryId = maxSummary && maxSummary.id ? maxSummary.id + 1 : 1;

        await DailySummary.updateOne(
            { date: dateStr },
            { id: summaryId, date: dateStr, total_revenue: totalRevenue, order_count: orderCount, orders_json: JSON.stringify(summaryData) },
            { upsert: true }
        );

        await Order.deleteMany({});
        await Menu.deleteMany({ $or: [{ isSpecial: true }, { category: "TODAY'S SPECIAL" }] });
        await Setting.deleteOne({ key: 'daily_special' });

        res.json({ success: true, summary: summaryData });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/settings', requireAdmin, async (req, res) => {
    try {
        const newSettings = req.body || {};
        const ownerQr = newSettings.ownerQr;
        const upiId = newSettings.upiId || '';
        if (typeof ownerQr !== 'string') {
            return res.status(400).json({ error: 'Invalid ownerQr' });
        }

        const sanitizedSettings = { ownerQr, upiId };
        await Setting.updateOne(
            { key: 'config' },
            { key: 'config', value: JSON.stringify(sanitizedSettings) },
            { upsert: true }
        );
        res.json(sanitizedSettings);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/generate-special', requireAdmin, async (req, res) => {
    try {
        const { name, imageUrl, price, type } = req.body || {};
        if (typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid special item name' });
        }
        if (imageUrl && !isValidUrl(imageUrl)) {
            return res.status(400).json({ error: 'Invalid imageUrl' });
        }
        const parsedPrice = parseInteger(price);
        if (parsedPrice === null || parsedPrice <= 0) {
            return res.status(400).json({ error: 'A valid price is required for the special item' });
        }

        const existingItem = await Menu.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            isSpecial: false
        }).lean();

        let finalImageUrl = '';
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
            finalImageUrl = imageUrl.trim();
        } else if (existingItem && existingItem.imageUrl) {
            finalImageUrl = existingItem.imageUrl;
        } else {
            return res.status(400).json({ error: 'Image URL is required for items not already in the menu' });
        }

        const specialObj = { text: name.trim(), imageUrl: finalImageUrl };

        await Menu.deleteMany({ isSpecial: true });

        const maxItem = await Menu.findOne().sort({ id: -1 }).lean();
        const nextId = maxItem && maxItem.id ? maxItem.id + 1 : 1;

        const newSpecial = await Menu.create({
            id: nextId,
            name: name.trim(),
            price: parsedPrice,
            category: "TODAY'S SPECIAL",
            type: type || (existingItem?.type || 'veg'),
            imageUrl: finalImageUrl,
            isSpecial: true,
            timeHash: Date.now()
        });

        await Setting.updateOne(
            { key: 'daily_special' },
            { key: 'daily_special', value: JSON.stringify({ ...specialObj, menuId: newSpecial.id }) },
            { upsert: true }
        );

        res.json(specialObj);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/daily-special', requireAdmin, async (req, res) => {
    try {
        await Menu.deleteMany({ isSpecial: true });
        await Setting.deleteOne({ key: 'daily_special' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/images/search', requireAdmin, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch from image provider');
        }

        const data = await response.json();
        
        let images = [];
        if (data.meals) {
            images = data.meals.slice(0, 6).map(meal => ({
                id: meal.idMeal,
                url: meal.strMealThumb,
                thumb: meal.strMealThumb + '/preview',
                credit: meal.strMeal,
                creditUrl: meal.strSource || '#'
            }));
        }

        res.json({ images });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Presentation data endpoint
app.get('/api/sql-dump', async (req, res) => {
    try {
        const orders = await Order.find().sort({ id: -1 }).lean();
        const menu = await Menu.find().sort({ id: -1 }).lean();
        const owners = await Owner.find().lean();
        const settings = await Setting.find().lean();
        const daily_summaries = await DailySummary.find().sort({ id: -1 }).lean();
        const customers = await Customer.find().lean();
        res.json({ orders, menu, owners, settings, daily_summaries, customers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ------------------------------------

const PORT = process.env.PORT || 3000;
connectMongoDB().then(async (isConnected) => {
    if (isConnected) {
        await seedMongoDB(initialMenu);
    } else {
        console.warn('⚠️ Server started without active MongoDB connection.');
    }
    app.listen(PORT, () => console.log(`Backend API live on http://localhost:${PORT}`));
});
