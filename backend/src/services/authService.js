// src/services/authService.js
// Authentication business logic

import bcrypt from 'bcryptjs';
import { findUserByIdentifier } from '../models/userModel.js';
import { findRoleById } from '../models/roleModel.js';
import { generateToken } from '../utils/jwt.js';

// Login user with email/username and password
export const loginUser = async (identifier, password) => {
  // Find user by email or username
  const user = await findUserByIdentifier(identifier);
  
  // User not found or soft-deleted
  if (!user) {
    return null;
  }

  // Check if user is active
  if (!user.is_active) {
    return null;
  }

  // Compare password with stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  // Get role details
  const role = await findRoleById(user.role_id);
  if (!role) {
    return null;
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.user_id,
    roleId: user.role_id,
    roleCode: role.role_code,
  });

  // Return user data (excluding password) and token
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    role,
    token,
  };
};

// Register a new user (password already hashed)
export const registerUser = async (userData) => {
  // Password should already be hashed by controller
  // This is a placeholder - will be implemented later
  throw new Error('Registration not implemented yet');
};