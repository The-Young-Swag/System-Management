// src/models/refreshTokenModel.js
// Database operations for RefreshTokenManagement table
// Tracks issued refresh tokens for session control, rotation, and revocation.
// Tokens are stored as SHA-256 hashes, never in plaintext.

import pool from '../config/db.js';

// Store a newly issued refresh token (already hashed by the caller).
// expiresAt should be a JS Date object or a MySQL-compatible datetime string.
export const storeRefreshToken = async (userId, tokenHash, expiresAt) => {
  const sql = `
    INSERT INTO RefreshTokenManagement (
      user_id,
      token_hash,
      expires_at,
      created_at
    ) VALUES (?, ?, ?, NOW())
  `;

  const [result] = await pool.query(sql, [userId, tokenHash, expiresAt]);
  return result.insertId;
};

// Find an active (not revoked, not expired) refresh token by its hash.
// This is the core check used on every /refresh request.
export const findActiveTokenByHash = async (tokenHash) => {
  const sql = `
    SELECT 
      token_id,
      user_id,
      token_hash,
      expires_at,
      revoked_at,
      created_at
    FROM RefreshTokenManagement
    WHERE token_hash = ?
      AND revoked_at IS NULL
      AND expires_at > NOW()
  `;

  const [rows] = await pool.query(sql, [tokenHash]);
  return rows.length > 0 ? rows[0] : null;
};

// Find a token by hash regardless of revoked/expired status.
// Used specifically for reuse-detection: if a already-revoked token is
// presented again, that's a signal of theft, and this lets the caller
// distinguish "never existed" from "existed but was already used/revoked."
export const findTokenByHash = async (tokenHash) => {
  const sql = `
    SELECT 
      token_id,
      user_id,
      token_hash,
      expires_at,
      revoked_at,
      created_at
    FROM RefreshTokenManagement
    WHERE token_hash = ?
  `;

  const [rows] = await pool.query(sql, [tokenHash]);
  return rows.length > 0 ? rows[0] : null;
};

// Revoke a single token by its hash (used during normal rotation, or logout).
export const revokeTokenByHash = async (tokenHash) => {
  const sql = `
    UPDATE RefreshTokenManagement
    SET revoked_at = NOW()
    WHERE token_hash = ?
      AND revoked_at IS NULL
  `;

  const [result] = await pool.query(sql, [tokenHash]);
  return result;
};

// Revoke every active token belonging to a user.
// Used for "log out of all devices," or as a defensive response if
// stolen-token reuse is detected — kills every session for that user.
export const revokeAllTokensForUser = async (userId) => {
  const sql = `
    UPDATE RefreshTokenManagement
    SET revoked_at = NOW()
    WHERE user_id = ?
      AND revoked_at IS NULL
  `;

  const [result] = await pool.query(sql, [userId]);
  return result;
};

// Delete expired tokens older than their expiry — housekeeping.
// Not called on every request; intended to be run periodically
// (e.g. a scheduled cleanup job) so the table doesn't grow unbounded.
export const deleteExpiredTokens = async () => {
  const sql = `
    DELETE FROM RefreshTokenManagement
    WHERE expires_at < NOW()
  `;

  const [result] = await pool.query(sql);
  return result;
};