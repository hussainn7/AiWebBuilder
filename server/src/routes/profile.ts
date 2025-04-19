import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile.js';

const router = express.Router();

// Removed auth middleware for local development
router.get('/', getProfile);
router.put('/', updateProfile);

export default router; 