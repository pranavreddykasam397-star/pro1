-- ============================================================================
-- HERITAGE RESTAURANT DATABASE INITIALIZATION & SEED SCRIPT
-- ============================================================================
-- Description: This comprehensive SQL script is designed to establish the 
-- core database schema, constraints, views, triggers, and sample data for 
-- the Heritage Restaurant application.
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================================
-- PART 1: DDL - TABLE CREATIONS & SCHEMA DEFINITION
-- ============================================================================

-- 1.1 Menu Table: Stores all available food items
CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL CHECK(price > 0),
    category VARCHAR(100) DEFAULT 'Uncategorized',
    type VARCHAR(20) DEFAULT 'veg',
    imageUrl TEXT,
    isSpecial INTEGER DEFAULT 0 CHECK(isSpecial IN (0, 1)),
    timeHash INTEGER NOT NULL
);

-- 1.2 Customers Table: Stores customer profiles and PINs
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    pin TEXT NOT NULL CHECK(length(pin) = 4),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Orders Table: Stores main order records
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total INTEGER NOT NULL CHECK(total >= 0),
    method VARCHAR(50) NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    timeHash INTEGER NOT NULL,
    customer_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 1.4 Order Items Table: Maps specific menu items to an order (Many-to-One)
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0 AND quantity <= 99),
    price_at_time INTEGER NOT NULL CHECK(price_at_time > 0),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 1.5 Settings Table: Stores app-wide configurations (Key-Value pair)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
);

-- 1.6 Daily Summaries Table: Stores aggregated daily revenue and order counts
CREATE TABLE IF NOT EXISTS daily_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    order_count INTEGER NOT NULL DEFAULT 0,
    orders_json TEXT NOT NULL
);

-- 1.7 Audit Log: Tracks changes to the menu for historical purposes
CREATE TABLE IF NOT EXISTS menu_audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER,
    old_price INTEGER,
    new_price INTEGER,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 2: INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_timeHash ON orders(timeHash DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category);

-- ============================================================================
-- PART 3: TRIGGERS FOR AUTOMATION AND INTEGRITY
-- ============================================================================

-- Trigger to log any price changes in the menu
CREATE TRIGGER IF NOT EXISTS trg_menu_price_update
AFTER UPDATE OF price ON menu
WHEN old.price <> new.price
BEGIN
    INSERT INTO menu_audit_log (menu_id, old_price, new_price)
    VALUES (old.id, old.price, new.price);
END;

-- ============================================================================
-- PART 4: VIEWS FOR REPORTING AND ANALYTICS
-- ============================================================================

-- View: Detailed Order History
-- Combines orders, their items, and customer information
CREATE VIEW IF NOT EXISTS vw_order_details AS
SELECT 
    o.id AS order_id,
    c.id AS customer_id,
    o.time AS order_date,
    o.method AS payment_method,
    oi.menu_name AS item_name,
    oi.quantity,
    oi.price_at_time,
    (oi.quantity * oi.price_at_time) AS line_total,
    o.total AS grand_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN customers c ON o.customer_id = c.id;

-- View: Menu Item Popularity
-- Ranks menu items by total quantity sold
CREATE VIEW IF NOT EXISTS vw_popular_items AS
SELECT 
    menu_name,
    SUM(quantity) AS total_sold,
    SUM(quantity * price_at_time) AS total_revenue_generated
FROM order_items
GROUP BY menu_name
ORDER BY total_sold DESC;

-- View: Revenue By Payment Method
CREATE VIEW IF NOT EXISTS vw_revenue_by_method AS
SELECT 
    method,
    COUNT(id) AS order_count,
    SUM(total) AS total_revenue
FROM orders
GROUP BY method
ORDER BY total_revenue DESC;

-- ============================================================================
-- PART 5: DML - SEED DATA INJECTION
-- ============================================================================

-- Seed System Settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('config', '{"ownerQr":"upi://pay?pa=dummy@upi"}');
UPDATE settings SET value = '{"ownerQr":"upi://pay?pa=restaurant@bank"}' WHERE key = 'config';

-- Seed Customers
INSERT OR IGNORE INTO customers (id, pin) VALUES (1001, '1234');
INSERT OR IGNORE INTO customers (id, pin) VALUES (2045, '9999');
INSERT OR IGNORE INTO customers (id, pin) VALUES (8832, '0000');

-- Seed Menu Items (Partial demo list)
INSERT OR IGNORE INTO menu (id, name, price, category, type, timeHash) VALUES 
(1, 'Butter Chicken', 350, 'CURRIES', 'non-veg', 1700000000),
(2, 'Paneer Tikka Masala', 280, 'CURRIES', 'veg', 1700000000),
(3, 'Garlic Naan', 60, 'BREADS', 'veg', 1700000000),
(4, 'Chicken Biryani', 320, 'BIRYANI', 'non-veg', 1700000000),
(5, 'Veg Fried Rice', 220, 'FRIED RICE', 'veg', 1700000000),
(6, 'Gulab Jamun', 120, 'DESSERTS', 'veg', 1700000000);

-- Seed Orders
INSERT OR IGNORE INTO orders (id, total, method, timeHash, customer_id) VALUES 
(1, 410, 'UPI', 1700000010, 1001),
(2, 320, 'Cash', 1700000020, 2045),
(3, 850, 'Card', 1700000030, NULL);

-- Seed Order Items
INSERT OR IGNORE INTO order_items (id, order_id, menu_name, quantity, price_at_time) VALUES 
(1, 1, 'Butter Chicken', 1, 350),
(2, 1, 'Garlic Naan', 1, 60),
(3, 2, 'Chicken Biryani', 1, 320),
(4, 3, 'Paneer Tikka Masala', 2, 280),
(5, 3, 'Veg Fried Rice', 1, 220),
(6, 3, 'Garlic Naan', 1, 60),
(7, 3, 'Gulab Jamun', 1, 120);

-- Trigger price update to populate audit log
UPDATE menu SET price = 360 WHERE id = 1;

-- ============================================================================
-- PART 6: DQL - COMPLEX QUERY EXAMPLES
-- ============================================================================

-- 6.1 Retrieve complete order receipt for a specific order (Order #3)
SELECT 
    o.id AS OrderID,
    o.time AS Timestamp,
    o.method AS PaymentMethod,
    oi.menu_name AS ItemName,
    oi.quantity AS Qty,
    oi.price_at_time AS UnitPrice,
    (oi.quantity * oi.price_at_time) AS Subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 3;

-- 6.2 Find top customers by spending
SELECT 
    c.id AS CustomerID,
    COUNT(o.id) AS TotalOrders,
    SUM(o.total) AS TotalSpent
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id
HAVING TotalSpent > 100
ORDER BY TotalSpent DESC;

-- 6.3 Identify items that have never been ordered
SELECT m.name, m.category 
FROM menu m
LEFT JOIN order_items oi ON m.name = oi.menu_name
WHERE oi.id IS NULL;

-- 6.4 Calculate Average Order Value (AOV)
SELECT ROUND(AVG(total), 2) AS AverageOrderValue FROM orders;

-- 6.5 View Audit Log for Price Changes
SELECT * FROM menu_audit_log ORDER BY changed_at DESC;

-- End of File
