// src/models/privilegeModel.js
// Database operations for PrivilegeManagement table ("The Matrix")
// Links MenuManagement <-> RoleManagement. Determines who can see what.

import pool from '../config/db.js';

// Check if a specific role has active access to a specific menu.
// Returns a plain boolean — this is a permission check, not a data lookup,
// so callers (e.g. rbacMiddleware) just need true/false, not row details.
export const checkPrivilege = async (roleId, menuId) => {
  const sql = `
    SELECT privilege_id
    FROM PrivilegeManagement
    WHERE role_id = ?
      AND menu_id = ?
      AND is_active = TRUE
  `;

  const [rows] = await pool.query(sql, [roleId, menuId]);
  return rows.length > 0;
};

// Get every menu a given role is allowed to see.
// Used to build the dynamic sidebar for a logged-in user.
export const findMenusByRole = async (roleId) => {
  const sql = `
    SELECT 
      m.menu_id,
      m.menu_name,
      m.menu_code,
      m.menu_link,
      m.display_order,
      m.menu_icon
    FROM PrivilegeManagement p
    INNER JOIN MenuManagement m ON p.menu_id = m.menu_id
    WHERE p.role_id = ?
      AND p.is_active = TRUE
      AND m.is_active = TRUE
      AND m.is_deleted = FALSE
    ORDER BY m.display_order ASC
  `;

  const [rows] = await pool.query(sql, [roleId]);
  return rows;
};

// Get every role that has access to a given menu.
// Useful for an admin screen: "who can see this menu?"
export const findRolesByMenu = async (menuId) => {
  const sql = `
    SELECT 
      r.role_id,
      r.role,
      r.role_code
    FROM PrivilegeManagement p
    INNER JOIN RoleManagement r ON p.role_id = r.role_id
    WHERE p.menu_id = ?
      AND p.is_active = TRUE
      AND r.is_active = TRUE
      AND r.is_deleted = FALSE
    ORDER BY r.role_id ASC
  `;

  const [rows] = await pool.query(sql, [menuId]);
  return rows;
};

// Get the full privilege matrix — every menu x role pairing, with names.
// Used for an admin dashboard showing the whole PrivilegeManagement grid.
export const getFullMatrix = async () => {
  const sql = `
    SELECT 
      p.privilege_id,
      p.menu_id,
      m.menu_name,
      m.menu_code,
      p.role_id,
      r.role,
      r.role_code,
      p.is_active
    FROM PrivilegeManagement p
    INNER JOIN MenuManagement m ON p.menu_id = m.menu_id
    INNER JOIN RoleManagement r ON p.role_id = r.role_id
    ORDER BY m.display_order ASC, r.role_id ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
};

// Assign a menu to a role (create one privilege row).
// Relies on the schema's UNIQUE (menu_id, role_id) constraint to prevent
// duplicates — if this pairing already exists, MySQL throws, and the
// caller (privilegeService) should catch and handle that case.
export const assignPrivilege = async (menuId, roleId) => {
  const sql = `
    INSERT INTO PrivilegeManagement (
      menu_id,
      role_id,
      is_active,
      created_at,
      updated_at
    ) VALUES (?, ?, TRUE, NOW(), NOW())
  `;

  const [result] = await pool.query(sql, [menuId, roleId]);
  return result.insertId;
};

// Revoke a specific role's access to a specific menu.
// Sets is_active = FALSE rather than deleting the row — preserves the
// historical record of the pairing having existed, consistent with the
// project's overall audit-trail philosophy.
export const revokePrivilege = async (menuId, roleId) => {
  const sql = `
    UPDATE PrivilegeManagement
    SET is_active = FALSE, updated_at = NOW()
    WHERE menu_id = ?
      AND role_id = ?
  `;

  const [result] = await pool.query(sql, [menuId, roleId]);
  return result;
};

// Re-enable a previously revoked privilege pairing.
export const reactivatePrivilege = async (menuId, roleId) => {
  const sql = `
    UPDATE PrivilegeManagement
    SET is_active = TRUE, updated_at = NOW()
    WHERE menu_id = ?
      AND role_id = ?
  `;

  const [result] = await pool.query(sql, [menuId, roleId]);
  return result;
};