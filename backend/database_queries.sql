-- ============================================================================
-- HERITAGE RESTAURANT ENTERPRISE DATABASE SCHEMA DEFINITION
-- ============================================================================
-- Description: Comprehensive Data Definition Language (DDL) script establishing 
-- the normalized relational database architecture for the Heritage Restaurant 
-- management system. This schema includes core operations, inventory management, 
-- human resources, customer relations, and automated data integrity triggers.
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA cache_size = -64000;

-- ============================================================================
-- MODULE 1: CORE SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 2: HUMAN RESOURCES & ACCESS CONTROL
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    permissions_level INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL,
    hire_date DATE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'ON_LEAVE', 'TERMINATED')),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    shift_type VARCHAR(50),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODULE 3: MENU & PRODUCT CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL CHECK(price > 0),
    category_id INTEGER,
    category VARCHAR(100) DEFAULT 'Uncategorized', -- Legacy support
    type VARCHAR(20) DEFAULT 'veg' CHECK(type IN ('veg', 'non-veg', 'vegan')),
    imageUrl TEXT,
    isSpecial INTEGER DEFAULT 0 CHECK(isSpecial IN (0, 1)),
    is_available INTEGER DEFAULT 1 CHECK(is_available IN (0, 1)),
    timeHash INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id)
);

-- ============================================================================
-- MODULE 4: INVENTORY & SUPPLY CHAIN MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT
);

CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    unit_of_measure VARCHAR(20) NOT NULL,
    current_stock_level DECIMAL(10,3) DEFAULT 0,
    reorder_threshold DECIMAL(10,3) DEFAULT 0,
    supplier_id INTEGER,
    last_restock_date DATETIME,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS menu_recipes (
    menu_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity_required DECIMAL(10,3) NOT NULL CHECK(quantity_required > 0),
    PRIMARY KEY (menu_id, ingredient_id),
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODULE 5: CUSTOMER RELATIONS & LOYALTY
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    pin TEXT NOT NULL CHECK(length(pin) = 4),
    phone VARCHAR(20) UNIQUE,
    loyalty_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    order_id INTEGER,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comments TEXT,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- ============================================================================
-- MODULE 6: ORDER PROCESSING & TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE,
    discount_percent INTEGER CHECK(discount_percent BETWEEN 1 AND 100),
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total INTEGER NOT NULL CHECK(total >= 0),
    method VARCHAR(50) NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    timeHash INTEGER NOT NULL,
    customer_id INTEGER,
    discount_id INTEGER,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    employee_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (discount_id) REFERENCES discounts(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_id INTEGER,
    menu_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0 AND quantity <= 99),
    price_at_time INTEGER NOT NULL CHECK(price_at_time > 0),
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS daily_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    order_count INTEGER NOT NULL DEFAULT 0,
    orders_json TEXT NOT NULL
);

-- ============================================================================
-- MODULE 7: AUDITING & LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER,
    old_price INTEGER,
    new_price INTEGER,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER,
    quantity_changed DECIMAL(10,3),
    reason VARCHAR(255),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 8: OPTIMIZATION INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_timeHash ON orders(timeHash DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock_level);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);

-- ============================================================================
-- MODULE 9: AUTOMATION TRIGGERS
-- ============================================================================

-- Trigger 1: Log menu price changes
CREATE TRIGGER IF NOT EXISTS trg_menu_price_update
AFTER UPDATE OF price ON menu
WHEN old.price <> new.price
BEGIN
    INSERT INTO menu_audit_log (menu_id, old_price, new_price)
    VALUES (old.id, old.price, new.price);
END;

-- Trigger 2: Update settings timestamp automatically
CREATE TRIGGER IF NOT EXISTS trg_settings_update
AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET last_updated = CURRENT_TIMESTAMP WHERE key = new.key;
END;

-- ============================================================================
-- MODULE 10: ANALYTICAL VIEWS
-- ============================================================================

-- View 1: Comprehensive Order Details
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

-- View 2: Menu Item Performance Analytics
CREATE VIEW IF NOT EXISTS vw_menu_performance AS
SELECT 
    menu_name,
    COUNT(DISTINCT order_id) as times_ordered,
    SUM(quantity) AS total_units_sold,
    SUM(quantity * price_at_time) AS total_revenue_generated
FROM order_items
GROUP BY menu_name
ORDER BY total_units_sold DESC;

-- View 3: Low Stock Alerts for Inventory Management
CREATE VIEW IF NOT EXISTS vw_low_stock_alerts AS
SELECT 
    i.id,
    i.name,
    i.current_stock_level,
    i.reorder_threshold,
    s.company_name AS supplier_name,
    s.phone AS supplier_phone
FROM ingredients i
LEFT JOIN suppliers s ON i.supplier_id = s.id
WHERE i.current_stock_level <= i.reorder_threshold;

-- View 4: Employee Active Directory
CREATE VIEW IF NOT EXISTS vw_active_employees AS
SELECT 
    e.id,
    e.first_name || ' ' || e.last_name AS full_name,
    r.role_name,
    e.email,
    e.phone
FROM employees e
JOIN roles r ON e.role_id = r.id
WHERE e.status = 'ACTIVE';

-- End of Schema Definition
