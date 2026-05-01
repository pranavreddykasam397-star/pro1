-- ===================================================================
-- HERITAGE RESTAURANT DATABASE 
-- ACADEMIC DEMONSTRATION SCRIPT
-- Demonstrating Database Modules from Syllabus
-- ===================================================================

-- ===================================================================
-- MODULE II: SQL Basics & Table Operations (DDL & DML)
-- ===================================================================
-- DDL: Creating Schema Tables
CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    category VARCHAR(100),
    timeHash INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    pin TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    total INTEGER NOT NULL,
    method VARCHAR(50) NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    timeHash INTEGER NOT NULL,
    customer_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    menu_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_time INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ===================================================================
-- DML: Inserting Demo Data 
-- ===================================================================
-- UNIVERSAL QUERY (Used by backend):
-- INSERT INTO customers (id, pin) VALUES (?, ?);
-- INSERT INTO menu (name, price, category, timeHash) VALUES (?, ?, ?, ?);

-- EXECUTABLE EXAMPLE (Run this to populate your database):
INSERT OR IGNORE INTO customers (id, pin) VALUES (101, '1234'), (102, '9999'), (103, '0000');

INSERT OR IGNORE INTO menu (id, name, price, category, timeHash) VALUES 
(1, 'Butter Chicken', 350, 'Curries', 100),
(2, 'Garlic Naan', 60, 'Breads', 100),
(3, 'Paneer Tikka', 280, 'Starters', 100),
(4, 'Chicken Biryani', 320, 'Rice', 100);

INSERT OR IGNORE INTO orders (id, total, method, timeHash, customer_id) VALUES 
(1, 410, 'UPI', 100, 101),
(2, 280, 'Cash', 101, 102),
(3, 320, 'Card', 102, 101);

INSERT OR IGNORE INTO order_items (id, order_id, menu_name, quantity, price_at_time) VALUES 
(1, 1, 'Butter Chicken', 1, 350),
(2, 1, 'Garlic Naan', 1, 60),
(3, 2, 'Paneer Tikka', 1, 280),
(4, 3, 'Chicken Biryani', 1, 320);

-- UNIVERSAL QUERY (Update / Delete):
-- UPDATE menu SET price = ? WHERE id = ?;
-- DELETE FROM menu WHERE id = ?;

-- EXECUTABLE EXAMPLE:
UPDATE menu SET price = 360 WHERE id = 1;
DELETE FROM menu WHERE id = 999; 

-- ===================================================================
-- MODULE III: Operators in SQL (Comparison, Logical, LIKE)
-- ===================================================================
-- 1. Logical and Comparison Operators
-- UNIVERSAL: SELECT * FROM menu WHERE price > ? AND price < ?;
-- EXECUTABLE:
SELECT * FROM menu 
WHERE price > 200 AND price < 400;

-- 2. Pattern Matching with LIKE
-- UNIVERSAL: SELECT * FROM menu WHERE name LIKE ?;
-- EXECUTABLE:
SELECT * FROM menu 
WHERE name LIKE '%Chicken%';


-- ===================================================================
-- MODULE IV: Filtering, Data Sorting and Pagination
-- ===================================================================
-- 1. IN and BETWEEN Clauses
-- UNIVERSAL: SELECT * FROM menu WHERE price BETWEEN ? AND ?;
-- EXECUTABLE:
SELECT * FROM menu 
WHERE price BETWEEN 100 AND 350;

-- UNIVERSAL: SELECT * FROM orders WHERE method IN (?, ?);
-- EXECUTABLE:
SELECT * FROM orders 
WHERE method IN ('UPI', 'Card');

-- 2. Ordering and Pagination (LIMIT and OFFSET clauses)
-- UNIVERSAL: SELECT * FROM menu ORDER BY price DESC LIMIT ? OFFSET ?;
-- EXECUTABLE:
SELECT * FROM menu 
ORDER BY price DESC 
LIMIT 2 OFFSET 1;


-- ===================================================================
-- MODULE V: Aggregations & Grouping
-- ===================================================================
-- 1. Data Aggregation Methods (SUM, COUNT, AVG)
-- UNIVERSAL: SELECT COUNT(*), SUM(total), AVG(total) FROM orders WHERE timeHash > ?;
-- EXECUTABLE:
SELECT COUNT(*) AS TotalOrders, SUM(total) AS TotalRevenue, AVG(total) AS AvgOrderValue
FROM orders;

-- 2. Grouping Data with GROUP BY and Filtering with HAVING
-- UNIVERSAL: SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id HAVING SUM(total) > ?;
-- EXECUTABLE:
SELECT customer_id, SUM(total) AS TotalSpent
FROM orders
GROUP BY customer_id
HAVING SUM(total) > 300;


-- ===================================================================
-- MODULE VI & VII: SQL Expressions, Functions, and Case Clause
-- ===================================================================
-- 1. SQL Case Clause inside SELECT
-- UNIVERSAL: 
-- SELECT id, total, CASE WHEN total > ? THEN 'High' ELSE 'Low' END FROM orders;
-- EXECUTABLE:
SELECT 
    id, 
    total,
    CASE 
        WHEN total > 400 THEN 'High Value'
        WHEN total > 200 THEN 'Medium Value'
        ELSE 'Low Value'
    END AS OrderCategory
FROM orders;


-- ===================================================================
-- MODULE IX: Joins & Multi-Table Queries
-- ===================================================================
-- 1. Inner Join (Linking Orders to their specific items)
-- UNIVERSAL: SELECT ... FROM orders o INNER JOIN order_items oi ON o.id = oi.order_id WHERE o.customer_id = ?;
-- EXECUTABLE:
SELECT 
    o.id AS OrderID, 
    o.method AS PaymentMethod, 
    oi.menu_name AS Item, 
    oi.quantity
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id;

-- 2. Left Join (Finding customers and their orders, even if no orders exist)
-- UNIVERSAL: SELECT ... FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE c.id = ?;
-- EXECUTABLE:
SELECT 
    c.id AS CustomerID, 
    o.id AS OrderID, 
    o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;


-- ===================================================================
-- MODULE X: View, Subqueries, and Index
-- ===================================================================
-- 1. Introduction to Indexes in SQL
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- 2. Introduction to View in DBMS
CREATE VIEW IF NOT EXISTS vw_customer_revenue AS
SELECT customer_id, SUM(total) AS TotalRevenue
FROM orders
GROUP BY customer_id;

-- 3. Querying Using Views
-- UNIVERSAL: SELECT * FROM vw_customer_revenue ORDER BY TotalRevenue DESC LIMIT ?;
-- EXECUTABLE:
SELECT * FROM vw_customer_revenue ORDER BY TotalRevenue DESC;

-- 4. Subqueries
-- UNIVERSAL: SELECT id FROM customers WHERE id = (SELECT customer_id FROM orders WHERE total > ? LIMIT 1);
-- EXECUTABLE:
SELECT id, pin 
FROM customers 
WHERE id = (SELECT customer_id FROM orders ORDER BY total DESC LIMIT 1);
