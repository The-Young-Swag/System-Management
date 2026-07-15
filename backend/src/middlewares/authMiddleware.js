// src/middlewares/authMiddleware.js
// JWT verification middleware. Extracts token from HttpOnly cookie,
// verifies it, and attaches user payload to req.user.
// Protects routes that require authentication.

import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Authentication middleware
 * Verifies JWT from cookie and attaches user data to req.user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * Behavior:
 * - Token found & valid → req.user = payload, call next()
 * - Token missing → 401 Unauthorized
 * - Token invalid/expired → 401 Unauthorized
 * 
 * Used in routes that require authentication (most protected endpoints)
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from HttpOnly cookie
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    // Attach user data to request for downstream middleware/controllers
    req.user = {
      userId: decoded.userId,
      roleId: decoded.roleId,
      roleCode: decoded.roleCode,
    };

    next();
  } catch (error) {
    // Catch any unexpected errors (shouldn't happen with verifyAccessToken returning null)
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Optional authentication middleware
 * Same as authMiddleware but doesn't block unauthenticated requests.
 * Used for endpoints that work for both logged-in and guest users.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * Behavior:
 * - Token valid → req.user = payload
 * - Token missing/invalid → req.user = null (request continues)
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          roleId: decoded.roleId,
          roleCode: decoded.roleCode,
        };
      }
    }

    // Always continue, even if no valid token
    next();
  } catch (error) {
    // On error, continue without user data (fail open for optional auth)
    req.user = null;
    next();
  }
};