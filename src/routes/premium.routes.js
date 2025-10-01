import express from 'express';
import {
    getPremiumFeatures,
    updatePremiumSubscription
} from '../controllers/premium.controller.js';

const router = express.Router();

// Premium routes
router.route('/:userId')
    .get(getPremiumFeatures)        // GET /premium/:userId
    .put(updatePremiumSubscription); // PUT /premium/:userId

export default router;
