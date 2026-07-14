-- SYSTEM-MANAGEMENT: RBAC AUTH SYSTEM
-- MySQL Schema
-- 1. MENU MANAGEMENT
-- Stores all UI components/routes available in the system
CREATE TABLE
    MenuManagement (
        menu_id INT AUTO_INCREMENT PRIMARY KEY,
        menu_name VARCHAR(100) NOT NULL,
        description TEXT,
        menu_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'ADMIN_DASHBOARD', used in middleware
        menu_link VARCHAR(255) NOT NULL, -- React route path, e.g. '/admin/dashboard'
        display_order INT NOT NULL DEFAULT 0, -- Controls sorting in the sidebar
        menu_icon VARCHAR(50), -- Icon class, e.g. 'fa fa-home'
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

-- 2. ROLE MANAGEMENT
-- Defines user roles (Admin, Manager, User, etc.)
CREATE TABLE
    RoleManagement (
        role_id INT AUTO_INCREMENT PRIMARY KEY,
        role VARCHAR(50) NOT NULL, -- Human-readable name, e.g. 'Administrator'
        role_code VARCHAR(30) NOT NULL UNIQUE, -- e.g. 'ADMIN', used in code logic
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

-- 3. PRIVILEGE MANAGEMENT ("The Matrix")
-- Links Menus to Roles. Determines WHO can see WHAT.
CREATE TABLE
    PrivilegeManagement (
        privilege_id INT AUTO_INCREMENT PRIMARY KEY,
        menu_id INT NOT NULL,
        role_id INT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_privilege_menu FOREIGN KEY (menu_id) REFERENCES MenuManagement (menu_id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_privilege_role FOREIGN KEY (role_id) REFERENCES RoleManagement (role_id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT unique_privilege UNIQUE (menu_id, role_id)
    );

-- 4. USER MANAGEMENT
-- Stores application users (with hashed passwords)
CREATE TABLE
    UserManagement (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        user_name VARCHAR(50) NOT NULL UNIQUE, -- Login username
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL, -- bcryptjs hash (60 chars, 255 is future-proof)
        role_id INT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES RoleManagement (role_id) ON DELETE RESTRICT ON UPDATE CASCADE
    );

CREATE TABLE
    RefreshTokenManagement (
        token_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of random token
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP NULL, -- NULL = active, set on logout/rotation
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES UserManagement (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT unique_token_hash UNIQUE (token_hash)
    );

CREATE INDEX idx_refresh_lookup ON RefreshTokenManagement (user_id, revoked_at);

-- PERFORMANCE INDEXES
-- Speeds up JOIN and WHERE lookups on frequently filtered columns
CREATE INDEX idx_menu_active ON MenuManagement (is_active, is_deleted);

CREATE INDEX idx_role_active ON RoleManagement (is_active, is_deleted);

CREATE INDEX idx_user_role ON UserManagement (role_id);

CREATE INDEX idx_privilege_lookup ON PrivilegeManagement (role_id, menu_id, is_active);