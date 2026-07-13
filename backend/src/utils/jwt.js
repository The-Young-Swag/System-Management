// src/utils/jwt.js
// JWT token generation and verification

import jwt from 'jsonwebtoken';

// Generate access token
export const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Verify access token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Decode token without verification (useful for debugging)
export const decodeToken = (token) => {
  return jwt.decode(token);
};