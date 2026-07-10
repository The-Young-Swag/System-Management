-- 
-- DATABASE: Replace 'your_db_name' with your actual DB name
-- 
CREATE DATABASE IF NOT EXISTS your_db_name;
USE your_db_name;

-- 
-- 1. MENU MANAGEMENT
-- Stores all UI components/routes available in the system
-- 
CREATE TABLE IF NOT EXISTS MenuManagement (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    description TEXT,
    menu_code VARCHAR(50) UNIQUE NOT NULL,   -- e.g., 'ADMIN_DASHBOARD', used in middleware
    menu_link VARCHAR(255) NOT NULL,          -- React route path, e.g. '/admin/dashboard'
    display_order INT DEFAULT 0,              -- Controls sorting in the sidebar
    menu_icon VARCHAR(50),                    -- Icon class, e.g., 'fa fa-home'
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 
-- 2. ROLE MANAGEMENT
-- Defines user roles (Admin, Manager, User, etc.)
-- 
CREATE TABLE IF NOT EXISTS RoleManagement (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL,                -- Human-readable name, e.g., 'Administrator'
    role_code VARCHAR(30) UNIQUE NOT NULL,    -- e.g., 'ADMIN', used in code logic
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 
-- 3. PRIVILEGE MANAGEMENT (The "Matrix")
-- Links Menus to Roles. Determines WHO can see WHAT.
-- 
CREATE TABLE IF NOT EXISTS PrivilegeManagement (
    privilege_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys: Prevent orphan records
    FOREIGN KEY (menu_id) REFERENCES MenuManagement(menu_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES RoleManagement(role_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Ensures a menu can only be assigned to a specific role ONCE
    UNIQUE KEY unique_privilege (menu_id, role_id)
);

-- 
-- 4. USER MANAGEMENT
-- Stores application users (with hashed passwords)
-- 
CREATE TABLE IF NOT EXISTS UserManagement (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_name VARCHAR(50) UNIQUE NOT NULL,    -- Login username
    email VARCHAR(100) UNIQUE NOT NULL,       -- Must be unique
    password VARCHAR(255) NOT NULL,           -- Store bcrypt hash (length 60, but 255 is future-proof)
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES RoleManagement(role_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 
-- 5. PERFORMANCE INDEXES (Highly Recommended)
-- Speeds up JOIN queries on foreign keys
-- 
CREATE INDEX idx_menu_active ON MenuManagement(is_active, is_deleted);
CREATE INDEX idx_role_active ON RoleManagement(is_active, is_deleted);
CREATE INDEX idx_user_role ON UserManagement(role_id);
CREATE INDEX idx_privilege_lookup ON PrivilegeManagement(role_id, menu_id, is_active);