// src/middlewares/rbacMiddleware.js
// Role-Based Access Control middleware.
// Checks permissions against PrivilegeManagement table or role codes.

import { checkPrivilege } from '../models/privilegeModel.js';
import { findMenuByCode } from '../models/menuModel.js';

/**
 * Check if user's role has permission to access a specific menu
 * @param {string} menuCode - The menu_code from MenuManagement
 * @returns {Function} Express middleware
 */
export const checkPermission = (menuCode) => {
  return async (req, res, next) => {
    try {
      // authMiddleware must run before this
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Get menu by code
      const menu = await findMenuByCode(menuCode);
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: `Menu with code '${menuCode}' not found`,
        });
      }

      // Check if user's role has privilege
      const hasPrivilege = await checkPrivilege(req.user.roleId, menu.menu_id);

      if (!hasPrivilege) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access this resource',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user's role is in a list of allowed roles
 * @param {string[]} allowedRoles - Array of role codes (e.g., ['ADMIN', 'MANAGER'])
 * @returns {Function} Express middleware
 */
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // authMiddleware must run before this
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(req.user.roleCode)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role permissions',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Combined permission + role check for extra security
 * @param {string} menuCode - The menu_code from MenuManagement
 * @param {string[]} allowedRoles - Array of role codes (optional)
 * @returns {Function} Express middleware
 */
export const requirePermission = (menuCode, allowedRoles = null) => {
  return async (req, res, next) => {
    try {
      // authMiddleware must run before this
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Role check (if allowedRoles provided)
      if (allowedRoles && !allowedRoles.includes(req.user.roleCode)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role permissions',
        });
      }

      // Permission check
      const menu = await findMenuByCode(menuCode);
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: `Menu with code '${menuCode}' not found`,
        });
      }

      const hasPrivilege = await checkPrivilege(req.user.roleId, menu.menu_id);
      if (!hasPrivilege) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access this resource',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};