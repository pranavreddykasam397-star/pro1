-- ===================================================================
-- PART 1: TABLE CREATIONS 
-- ===================================================================

CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    timeHash INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    total INTEGER NOT NULL,
    method VARCHAR(50) NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    timeHash INTEGER NOT NULL,
    customer_id INTEGER
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

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    pin TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);



-- ===================================================================
-- PART 2: MODIFYING DATA (Run these before we SELECT)
-- ===================================================================

INSERT INTO settings (key, value) VALUES ('config', '{"ownerQr":""}');
UPDATE settings SET value = '{"ownerQr":"upi://pay?pa=..."}' WHERE key = 'config';
DELETE FROM menu WHERE id = 3; 


-- ===================================================================
-- PART 3: FETCHING DATA (Must be at the very bottom for online playgrounds!)
-- ===================================================================

-- 1. Fetch all orders
SELECT * FROM orders ORDER BY timeHash DESC;

-- 2. Fetch the joined tables (See exact items in the order)
SELECT o.id AS OrderID, oi.menu_name AS ItemName, oi.quantity AS Qty, oi.price_at_time AS Price, o.method AS Payment
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.id = 1;

-- 3. Fetch the final menu (THIS WILL SHOW ON YOUR SCREEN NOW)
SELECT * FROM menu;
give the local host for the demo web
