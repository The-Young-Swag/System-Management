// src/models/roleModel.js
// Database operations for RoleManagement table

import pool from '../config/db.js';

// Get role by ID
export const findRoleById = async (roleId) => {
  const sql = `
    SELECT 
      role_id,
      role,
      role_code,
      is_active,
      is_deleted
    FROM RoleManagement
    WHERE role_id = ?
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [roleId]);
  return rows.length > 0 ? rows[0] : null;
};

// Get role by role code (e.g., 'ADMIN', 'MANAGER')
export const findRoleByCode = async (roleCode) => {
  const sql = `
    SELECT 
      role_id,
      role,
      role_code,
      is_active,
      is_deleted
    FROM RoleManagement
    WHERE role_code = ?
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [roleCode]);
  return rows.length > 0 ? rows[0] : null;
};

// Get all active roles
export const getAllRoles = async () => {
  const sql = `
    SELECT 
      role_id,
      role,
      role_code,
      is_active,
      created_at
    FROM RoleManagement
    WHERE is_deleted = FALSE
    ORDER BY role_id ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
};

// Create a new role
export const createRole = async (roleData) => {
  const { role, role_code } = roleData;

  const sql = `
    INSERT INTO RoleManagement (
      role,
      role_code,
      is_active,
      is_deleted,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await pool.query(sql, [
    role,
    role_code,
    true,
    false,
  ]);

  return findRoleById(result.insertId);
};

// Soft delete a role
export const softDeleteRole = async (roleId) => {
  const sql = `
    UPDATE RoleManagement
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE role_id = ?
  `;

  const [result] = await pool.query(sql, [roleId]);
  return result;
};