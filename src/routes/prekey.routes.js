/**
 * Prekey Management Routes
 * Public endpoints for prekey distribution (no authentication on fetch)
 */

import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  uploadPrekeyBundle,
  fetchPrekeyBundle,
  refreshOneTimePrekeys,
  getPrekeyStatus,
} from '../controllers/prekey.controller.js';

const router = express.Router();

/**
 * @api POST /api/v1/keys/prekeys
 * @desc Upload prekey bundle (identity key + signed prekey + one-time prekeys)
 * @access Private (requires auth)
 */
router.post('/prekeys', verifyJWT, uploadPrekeyBundle);

/**
 * @api GET /api/v1/keys/prekeys/:userId
 * @desc Fetch peer's prekey bundle for session initiation
 * @access Public (prekeys are public data, authenticated by signature)
 * Note: Could add rate limiting to prevent abuse
 */
router.get('/prekeys/:userId', fetchPrekeyBundle);

/**
 * @api POST /api/v1/keys/refresh
 * @desc Add new batch of one-time prekeys
 * @access Private (requires auth)
 */
router.post('/refresh', verifyJWT, refreshOneTimePrekeys);

/**
 * @api GET /api/v1/keys/status
 * @desc Get current prekey bundle status
 * @access Private (requires auth)
 */
router.get('/status', verifyJWT, getPrekeyStatus);

export default router;
