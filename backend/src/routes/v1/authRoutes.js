// src/routes/v1/authRoutes.js
// Authentication route definitions

import express from 'express';
import { login, refresh, logout } from '../../controllers/authController.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', login);
router.post('/refresh', refresh);

// Protected route (requires valid JWT)
router.post('/logout', authMiddleware, logout);

export default router;