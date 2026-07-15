// src/services/authService.js
import bcrypt from 'bcryptjs';
import { findUserById, findUserByIdentifier } from '../models/userModel.js';
import { findRoleById } from '../models/roleModel.js';
import {
  storeRefreshToken,
  findActiveTokenByHash,
  findTokenByHash,
  revokeTokenByHash,
  revokeAllTokensForUser,
} from '../models/refreshTokenModel.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt.js';

export const loginUser = async (identifier, password) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) return null;
  if (!user.is_active) return null;

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) return null;

  const role = await findRoleById(user.role_id);
  if (!role) return null;

  const accessToken = generateAccessToken({
    userId: user.user_id,
    roleId: role.role_id,
    roleCode: role.role_code,
  });

  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();
  await storeRefreshToken(user.user_id, tokenHash, expiresAt);

  const { password: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: { ...userWithoutPassword, role: role.role, role_code: role.role_code },
  };
};

export const refreshSession = async (presentedRefreshToken) => {
  const tokenHash = hashRefreshToken(presentedRefreshToken);
  const activeToken = await findActiveTokenByHash(tokenHash);

  if (!activeToken) {
    const anyToken = await findTokenByHash(tokenHash);
    if (anyToken && anyToken.revoked_at) {
      await revokeAllTokensForUser(anyToken.user_id);
    }
    return null;
  }

  await revokeTokenByHash(tokenHash);

  const user = await findUserById(activeToken.user_id); // fixed: was findUserByIdentifier
  if (!user || !user.is_active) return null;

  const role = await findRoleById(user.role_id);
  if (!role) return null;

  const newAccessToken = generateAccessToken({
    userId: user.user_id,
    roleId: role.role_id,
    roleCode: role.role_code,
  });

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = getRefreshTokenExpiry();
  await storeRefreshToken(user.user_id, newTokenHash, newExpiresAt);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (presentedRefreshToken) => {
  const tokenHash = hashRefreshToken(presentedRefreshToken);
  await revokeTokenByHash(tokenHash);
};

export const registerUser = async (userData) => {
  throw new Error('Registration not implemented yet');
};