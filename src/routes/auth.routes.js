import express from 'express';
import {
    sendOtp,
    logoutUser,
    authUser,
    googleSignIn
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/auth', authUser);
router.post('/logout', logoutUser); // Note: Actual token invalidation should be handled on client side or with a token blacklist
router.post('/google', googleSignIn);

export default router;
