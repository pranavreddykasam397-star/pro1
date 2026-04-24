const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function seedDatabase() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    console.log("Setting up database tables...");

    // 1. RECREATE TABLES IF MISSING
    await db.exec(`
        CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, price INTEGER NOT NULL, category VARCHAR(100), type VARCHAR(20), imageUrl TEXT, timeHash INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, total INTEGER NOT NULL, method VARCHAR(50) NOT NULL, time DATETIME DEFAULT CURRENT_TIMESTAMP, timeHash INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, menu_name VARCHAR(255) NOT NULL, quantity INTEGER NOT NULL, price_at_time INTEGER NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS settings (key VARCHAR(50) PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS daily_summaries (id INTEGER PRIMARY KEY, date TEXT NOT NULL UNIQUE, total_revenue INTEGER NOT NULL, order_count INTEGER NOT NULL, orders_json TEXT NOT NULL);
    `);

    console.log("Database tables ready. Initial menu setup is handled by the frontend.");
    console.log("Note: Menu duplication has been fixed - duplicates will no longer be created.")

    await db.close();
}
