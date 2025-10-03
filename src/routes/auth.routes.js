import express from 'express';
import {
    sendOtp,
    logoutUser,
    authUser,
    // googleSignIn
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/send-otp', sendOtp);                //http://localhost:3000/api/v1/auth/send-otp
router.post('/authintication', authUser);         //http://localhost:3000/api/v1/auth/authintication
router.post('/logout', logoutUser); // Note: Actual token invalidation should be handled on client side or with a token blacklist
// router.post('/google', googleSignIn);              //http://localhost:3000/api/v1/auth/google

export default router;
