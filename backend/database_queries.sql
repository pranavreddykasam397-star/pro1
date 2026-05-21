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

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    total INTEGER NOT NULL,
    method VARCHAR(50) NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    timeHash INTEGER NOT NULL,
    customer_id INTEGER,
    phone VARCHAR(20)
);

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

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    pin TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);
-- Settings
INSERT INTO settings (key, value) VALUES ('config', ?);
SELECT * FROM settings WHERE key = 'config';
UPDATE settings SET value = ? WHERE key = 'config';
INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_special', ?);
DELETE FROM settings WHERE key = 'daily_special';

-- Menu&Special
DELETE FROM menu;
INSERT INTO menu (name, price, category, type, imageUrl, timeHash) VALUES (?, ?, ?, ?, ?, ?);
INSERT INTO menu (name, price, category, type, imageUrl, isSpecial, timeHash) VALUES (?, ?, ?, ?, ?, 1, ?);
SELECT * FROM menu;
SELECT * FROM menu WHERE id = ?;
SELECT * FROM menu WHERE LOWER(name) = LOWER(?) AND isSpecial = 0;
SELECT price FROM menu WHERE id = ?;
SELECT price FROM menu WHERE name = ?;
DELETE FROM menu WHERE id = ?;
DELETE FROM menu WHERE isSpecial = 1;
DELETE FROM menu WHERE isSpecial = 1 OR category = 'TODAY''S SPECIAL';

-- Orders
INSERT INTO orders (total, method, time, timeHash, customer_id, payment_status, phone) VALUES (?, ?, ?, ?, ?, ?, ?);
SELECT * FROM orders;
SELECT * FROM orders WHERE id = ?;
SELECT customer_id FROM orders WHERE id = ?;
UPDATE orders SET payment_status = ? WHERE id = ?;
UPDATE orders SET payment_screenshot = ?, payment_status = 'SCREENSHOT_UPLOADED' WHERE id = ?;
DELETE FROM orders;

-- Order Items
INSERT INTO order_items (order_id, menu_name, quantity, price_at_time) VALUES (?, ?, ?, ?);
SELECT menu_name AS name, quantity AS qty, price_at_time AS price FROM order_items WHERE order_id = ?;

-- Admin orders JOIN
SELECT
    o.id AS id, o.total AS total, o.method AS method,
    o.time AS time, o.timeHash AS timeHash,
    o.customer_id AS customer_id, o.phone AS phone,
    o.payment_status AS payment_status,
    o.payment_screenshot AS payment_screenshot,
    oi.menu_name AS name, oi.quantity AS qty, oi.price_at_time AS price
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
ORDER BY o.timeHash DESC;

-- Customer order history
SELECT
    o.id AS id, o.total AS total, o.method AS method,
    o.time AS time, o.timeHash AS timeHash,
    oi.menu_name AS name, oi.quantity AS qty, oi.price_at_time AS price
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.customer_id = ?
ORDER BY o.timeHash DESC;

-- Daily summaries
SELECT * FROM daily_summaries ORDER BY id DESC;
INSERT OR REPLACE INTO daily_summaries (date, total_revenue, order_count, orders_json) VALUES (?, ?, ?, ?);

-- Customers
INSERT INTO customers (id, pin) VALUES (?, ?);
SELECT id FROM customers WHERE id = ?;
SELECT * FROM customers WHERE id = ?;

-- Owners
SELECT * FROM owners WHERE email = ?;
INSERT INTO owners (email, password_hash) VALUES (?, ?);

-- End-of-day items summary
SELECT o.id AS order_id, oi.menu_name, oi.quantity, oi.price_at_time
FROM orders o
JOIN order_items oi ON oi.order_id = o.id;