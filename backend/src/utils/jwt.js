// src/utils/jwt.js
// Access token (JWT) signing/verification, and refresh token generation/hashing.
// Access tokens are short-lived JWTs. Refresh tokens are opaque random strings,
// hashed with SHA-256 before being stored in RefreshTokenManagement — never
// stored or transmitted in plaintext.

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// --- Access Token (JWT) ---

// Sign a short-lived access token containing minimal, non-sensitive claims.
// payload should be { userId, roleId, roleCode } — never passwords/emails.
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

// Verify an access token. Returns the decoded payload if valid,
// or null if invalid/expired/tampered — caller decides how to respond.
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

// --- Refresh Token (opaque random string, not a JWT) ---

// Generate a cryptographically random refresh token string.
// 256 bits of entropy — not guessable, doesn't need a signature to be trusted,
// since validity is checked against the database instead.
export const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a refresh token string with SHA-256 before storing/comparing it.
// Fast hash is correct here (unlike bcryptjs for passwords) because the
// token is already high-entropy — there's nothing to brute-force.
export const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Calculate the expiry Date for a new refresh token, based on
// JWT_REFRESH_EXPIRES_IN (e.g. '7d'). Returns a JS Date for storage
// in RefreshTokenManagement.expires_at.
export const getRefreshTokenExpiry = () => {
  const duration = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN format: ${duration}`);
  }

  const [, amountStr, unit] = match;
  const amount = Number(amountStr);

  const unitToMs = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };

  return new Date(Date.now() + amount * unitToMs[unit]);
};