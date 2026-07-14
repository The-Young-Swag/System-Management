// src/models/userModel.js
// Database operations for UserManagement table

import pool from '../config/db.js';

export const findUserById = async (id) => {
    const sql = `
    SELECT 
      user_id,
      name,
      user_name,
      email,
      password,
      role_id,
      is_active,
      is_deleted,
      created_at,
      updated_at
    FROM UserManagement
    WHERE user_id = ?
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
};

// Find user by email address
// Uses parameterized query to prevent SQL injection
// Excludes soft-deleted users (is_deleted = FALSE)
export const findUserByEmail = async (email) => {
  const sql = `
    SELECT 
      user_id,
      name,
      user_name,
      email,
      password,
      role_id,
      is_active,
      is_deleted,
      created_at,
      updated_at
    FROM UserManagement
    WHERE email = ?
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
};

// Find user by username
// Excludes soft-deleted users
export const findUserByUsername = async (username) => {
  const sql = `
    SELECT 
      user_id,
      name,
      user_name,
      email,
      password,
      role_id,
      is_active,
      is_deleted,
      created_at,
      updated_at
    FROM UserManagement
    WHERE user_name = ?
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [username]);
  return rows.length > 0 ? rows[0] : null;
};

// Find user by email OR username (flexible login)
// Excludes soft-deleted users
export const findUserByIdentifier = async (identifier) => {
  const sql = `
    SELECT 
      user_id,
      name,
      user_name,
      email,
      password,
      role_id,
      is_active,
      is_deleted,
      created_at,
      updated_at
    FROM UserManagement
    WHERE (email = ? OR user_name = ?)
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [identifier, identifier]);
  return rows.length > 0 ? rows[0] : null;
};

// Create a new user
// Password must already be hashed by bcrypt before calling this
export const createUser = async (userData) => {
  const { name, user_name, email, password, role_id } = userData;

  const sql = `
    INSERT INTO UserManagement (
      name,
      user_name,
      email,
      password,
      role_id,
      is_active,
      is_deleted,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await pool.query(sql, [
    name,
    user_name,
    email,
    password,
    role_id,
    true,
    false,
  ]);

  return findUserById(result.insertId);
};

// Update user's last activity timestamp
export const updateUserTimestamp = async (userId) => {
  const sql = `
    UPDATE UserManagement
    SET updated_at = NOW()
    WHERE user_id = ?
  `;

  await pool.query(sql, [userId]);
};

// Soft delete a user (mark as deleted, not actually removed)
export const softDeleteUser = async (userId) => {
  const sql = `
    UPDATE UserManagement
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE user_id = ?
  `;

  const [result] = await pool.query(sql, [userId]);
  return result;
};

// Get all active users with their role information
// Excludes soft-deleted users, ordered by creation date (newest first)
export const getAllUsers = async () => {
  const sql = `
    SELECT 
      u.user_id,
      u.name,
      u.user_name,
      u.email,
      u.is_active,
      u.created_at,
      r.role_id,
      r.role,
      r.role_code
    FROM UserManagement u
    LEFT JOIN RoleManagement r ON u.role_id = r.role_id
    WHERE u.is_deleted = FALSE
    ORDER BY u.created_at DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
};