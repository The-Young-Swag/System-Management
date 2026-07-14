-- SYSTEM-MANAGEMENT: RBAC AUTH SYSTEM
-- PostgreSQL Schema

-- 1. MENU MANAGEMENT
-- Stores all UI components/routes available in the system
CREATE TABLE MenuManagement (
    menu_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    description TEXT,
    menu_code VARCHAR(50) NOT NULL UNIQUE,   -- e.g. 'ADMIN_DASHBOARD', used in middleware
    menu_link VARCHAR(255) NOT NULL,-- React route path, e.g. '/admin/dashboard'
    display_order INTEGER NOT NULL DEFAULT 0, -- Controls sorting in the sidebar
    menu_icon VARCHAR(50),-- Icon class, e.g. 'fa fa-home'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROLE MANAGEMENT
-- Defines user roles (Admin, Manager, User, etc.)
CREATE TABLE RoleManagement (
    role_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role  VARCHAR(50) NOT NULL, -- Human-readable name, e.g. 'Administrator'
    role_code VARCHAR(30) NOT NULL UNIQUE, -- e.g. 'ADMIN', used in code logic
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRIVILEGE MANAGEMENT ("The Matrix")
-- Links Menus to Roles. Determines WHO can see WHAT.
CREATE TABLE PrivilegeManagement (
    privilege_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    menu_id INTEGER NOT NULL REFERENCES MenuManagement(menu_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    role_id INTEGER NOT NULL REFERENCES RoleManagement(role_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_privilege UNIQUE (menu_id, role_id)
);

-- 4. USER MANAGEMENT
-- Stores application users (with hashed passwords)
CREATE TABLE UserManagement (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  VARCHAR(100) NOT NULL,
    user_name VARCHAR(50) NOT NULL UNIQUE, -- Login username
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,-- bcryptjs hash (60 chars, 255 is future-proof)
    role_id INTEGER NOT NULL REFERENCES RoleManagement(role_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. REFRESH TOKEN MANAGEMENT
-- Tracks issued refresh tokens for session control and revocation.
-- token is a random string (crypto.randomBytes), hashed with SHA-256 before storage —
-- NOT bcrypt/bcryptjs, since the token is already high-entropy and doesn't need
-- slow, brute-force-resistant hashing the way human passwords do.
CREATE TABLE RefreshTokenManagement (
    token_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES UserManagement(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    token_hash VARCHAR(255) NOT NULL,   -- SHA-256 hash of random token
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,        -- NULL = active, set on logout/rotation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_token_hash UNIQUE (token_hash)
);

-- 6. PERFORMANCE INDEXES
-- Speeds up JOIN and WHERE lookups on frequently filtered columns
CREATE INDEX idx_menu_active ON MenuManagement (is_active, is_deleted);
CREATE INDEX idx_role_active ON RoleManagement (is_active, is_deleted);
CREATE INDEX idx_user_role ON UserManagement (role_id);
CREATE INDEX idx_privilege_lookup ON PrivilegeManagement (role_id, menu_id, is_active);
CREATE INDEX idx_refresh_lookup ON RefreshTokenManagement (user_id, revoked_at);

-- 7. AUTO-UPDATE updated_at ON ROW MODIFICATION
-- Postgres has no built-in "ON UPDATE CURRENT_TIMESTAMP" clause
-- (unlike MySQL), so this is done via a trigger function.
-- Note: RefreshTokenManagement has no updated_at column — its rows are
-- either inserted once or their revoked_at is set; there's no general
-- "last modified" concept worth tracking there, so no trigger applies.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_menu_updated_at
    BEFORE UPDATE ON MenuManagement
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_role_updated_at
    BEFORE UPDATE ON RoleManagement
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_privilege_updated_at
    BEFORE UPDATE ON PrivilegeManagement
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON UserManagement
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();