// src/models/menuModel.js
// Database operations for MenuManagement table

import pool from '../config/db.js';

// Get menu by ID
export const findMenuById = async (menuId) => {
  const sql = `
    SELECT 
      menu_id,
      menu_name,
      description,
      menu_code,
      menu_link,
      display_order,
      menu_icon,
      is_active,
      is_deleted,
      created_at,
      updated_at
    FROM MenuManagement
    WHERE menu_id = ?
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [menuId]);
  return rows.length > 0 ? rows[0] : null;
};

// Get menu by menu code (e.g., 'ADMIN_DASHBOARD')
export const findMenuByCode = async (menuCode) => {
  const sql = `
    SELECT 
      menu_id,
      menu_name,
      description,
      menu_code,
      menu_link,
      display_order,
      menu_icon,
      is_active,
      is_deleted,
      created_at,
      updated_at
    FROM MenuManagement
    WHERE menu_code = ?
      AND is_deleted = FALSE
  `;

  const [rows] = await pool.query(sql, [menuCode]);
  return rows.length > 0 ? rows[0] : null;
};

// Get all active menus, ordered for sidebar display
export const getAllMenus = async () => {
  const sql = `
    SELECT 
      menu_id,
      menu_name,
      description,
      menu_code,
      menu_link,
      display_order,
      menu_icon,
      is_active,
      is_deleted,
      created_at,
      updated_at
    FROM MenuManagement
    WHERE is_deleted = FALSE
    ORDER BY display_order ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
};

// Create a new menu
export const createMenu = async (menuData) => {
  const { menu_name, description, menu_code, menu_link, display_order, menu_icon } = menuData;

  const sql = `
    INSERT INTO MenuManagement (
      menu_name,
      description,
      menu_code,
      menu_link,
      display_order,
      menu_icon,
      is_active,
      is_deleted,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await pool.query(sql, [
    menu_name,
    description || null,
    menu_code,
    menu_link,
    display_order || 0,
    menu_icon || null,
    true,
    false,
  ]);

  return findMenuById(result.insertId);
};

// Soft delete a menu
export const softDeleteMenu = async (menuId) => {
  const sql = `
    UPDATE MenuManagement
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE menu_id = ?
  `;

  const [result] = await pool.query(sql, [menuId]);
  return result;
};