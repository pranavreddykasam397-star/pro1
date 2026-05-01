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
-- PART 2: SIMULATING LIVE WEB APP CHANGES
-- ===================================================================

-- 1. A new customer signs up and gets a unique ID and PIN
INSERT INTO customers (id, pin) VALUES (9999, '1234');

-- 2. The customer places an order
INSERT INTO orders (id, total, method, timeHash, customer_id) 
VALUES (101, 630, 'UPI', 1714567890, 9999);

-- 3. The items for that order are added to the order_items table
INSERT INTO order_items (order_id, menu_name, quantity, price_at_time) 
VALUES (101, 'Butter Chicken', 1, 350);

INSERT INTO order_items (order_id, menu_name, quantity, price_at_time) 
VALUES (101, 'Paneer Tikka Masala', 1, 280);

-- ===================================================================
-- PART 3: FETCHING DATA
-- ===================================================================
SELECT * FROM customers;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM menu;
