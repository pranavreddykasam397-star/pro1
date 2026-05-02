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

INSERT INTO settings (key, value) VALUES ('config', '{"ownerQr":""}');
UPDATE settings SET value = '{"ownerQr":"upi://pay?pa=..."}' WHERE key = 'config';
DELETE FROM menu WHERE id = 3; 

SELECT * FROM orders ORDER BY timeHash DESC;

SELECT o.id AS OrderID, oi.menu_name AS ItemName, oi.quantity AS Qty, oi.price_at_time AS Price, o.method AS Payment
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.id = 1;

SELECT * FROM menu;


-- 2. Aggregation & Grouping
SELECT method, COUNT(id) AS count, SUM(total) AS total_revenue
FROM orders
GROUP BY method
HAVING total_revenue > 0
ORDER BY total_revenue DESC;

SELECT menu_name, SUM(quantity) AS total_sold, SUM(quantity * price_at_time) AS total_revenue
FROM order_items
GROUP BY menu_name
ORDER BY total_sold DESC;

-- 3. Subqueries & Advanced Filtering
SELECT id, total, method, time
FROM orders
WHERE total > (SELECT AVG(total) FROM orders)
ORDER BY total DESC;

SELECT id, pin, created_at
FROM customers
WHERE id IN (
    SELECT customer_id 
    FROM orders 
    GROUP BY customer_id 
    HAVING COUNT(id) >= 5
);

-- 4. Complex Joins
SELECT 
    o.id AS OrderID,
    o.time AS OrderTime,
    c.id AS CustomerID,
    COUNT(oi.id) AS UniqueItems,
    SUM(oi.quantity) AS TotalItems
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.time, c.id;
