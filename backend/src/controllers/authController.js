// src/controllers/authController.js
// Authentication HTTP request handlers

import {
  loginUser,
  refreshSession,
  logoutUser,
} from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Cookie configuration helper
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge,
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Identifier (email/username) and password are required',
    });
  }

  const result = await loginUser(identifier, password);

  if (!result) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Set access token cookie (15 minutes)
  res.cookie('jwt', result.accessToken, cookieOptions(15 * 60 * 1000));

  // Set refresh token cookie (7 days)
  res.cookie('refreshToken', result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

  return res.status(200).json({
    success: true,
    user: result.user,
  });
});

// POST /api/v1/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required',
    });
  }

  const result = await refreshSession(refreshToken);

  if (!result) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }

  // Rotate cookies: set new access token and new refresh token
  res.cookie('jwt', result.accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

  return res.status(200).json({
    success: true,
  });
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  // Clear both cookies
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});