-- ===================================================================
-- HERITAGE RESTAURANT DATABASE 
-- BACKEND PREPARED STATEMENTS TEMPLATE
-- Demonstrating Syllabus Modules Dynamically for the Web App
-- ===================================================================
-- NOTE: All DML and DQL queries here use parameters (?) to demonstrate
-- how the Node.js backend executes them securely and dynamically for ANY item.

PRAGMA foreign_keys = ON;

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

-- DML: Dynamic Inserts (Working for ANY item/customer from the web)
INSERT INTO customers (id, pin) VALUES (?, ?);
INSERT INTO menu (name, price, category, timeHash) VALUES (?, ?, ?, ?);
INSERT INTO orders (total, method, timeHash, customer_id) VALUES (?, ?, ?, ?);
INSERT INTO order_items (order_id, menu_name, quantity, price_at_time) VALUES (?, ?, ?, ?);

-- DML: Dynamic Updates and Deletions
UPDATE menu SET price = ? WHERE id = ?;
DELETE FROM menu WHERE id = ?;


-- ===================================================================
-- MODULE III: Operators in SQL (Comparison, Logical, LIKE)
-- ===================================================================
-- 1. Logical and Comparison Operators (Dynamic price range)
SELECT * FROM menu 
WHERE price > ? AND price < ?;

-- 2. Pattern Matching with LIKE (Dynamic search query from frontend)
SELECT * FROM menu 
WHERE name LIKE ?;


-- ===================================================================
-- MODULE IV: Filtering, Data Sorting and Pagination
-- ===================================================================
-- 1. IN and BETWEEN Clauses (Dynamic filtering)
SELECT * FROM menu 
WHERE price BETWEEN ? AND ?;

SELECT * FROM orders 
WHERE method IN (?, ?);

-- 2. Ordering and Pagination (Dynamic page limits for the web)
SELECT * FROM menu 
ORDER BY price DESC 
LIMIT ? OFFSET ?;


-- ===================================================================
-- MODULE V: Aggregations & Grouping
-- ===================================================================
-- 1. Data Aggregation Methods (Dynamic time range)
SELECT COUNT(*) AS TotalOrders, SUM(total) AS TotalRevenue, AVG(total) AS AvgOrderValue
FROM orders
WHERE timeHash > ?;

-- 2. Grouping Data with GROUP BY and Filtering with HAVING
SELECT customer_id, SUM(total) AS TotalSpent
FROM orders
GROUP BY customer_id
HAVING SUM(total) > ?;


-- ===================================================================
-- MODULE VI & VII: SQL Expressions, Functions, and Case Clause
-- ===================================================================
-- 1. SQL Case Clause inside SELECT (Dynamic thresholds)
SELECT 
    id, 
    total,
    CASE 
        WHEN total > ? THEN 'High Value'
        WHEN total > ? THEN 'Medium Value'
        ELSE 'Low Value'
    END AS OrderCategory
FROM orders;


-- ===================================================================
-- MODULE IX: Joins & Multi-Table Queries
-- ===================================================================
-- 1. Inner Join (Dynamic order lookup for specific customer)
SELECT 
    o.id AS OrderID, 
    o.method AS PaymentMethod, 
    oi.menu_name AS Item, 
    oi.quantity
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_id = ?;

-- 2. Left Join (Dynamic customer lookup)
SELECT 
    c.id AS CustomerID, 
    o.id AS OrderID, 
    o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.id = ?;


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

-- 3. Querying Using Views (Dynamic limit)
SELECT * FROM vw_customer_revenue ORDER BY TotalRevenue DESC LIMIT ?;

-- 4. Subqueries (Dynamic threshold lookup)
SELECT id, pin 
FROM customers 
WHERE id = (SELECT customer_id FROM orders WHERE total > ? ORDER BY total DESC LIMIT 1);
