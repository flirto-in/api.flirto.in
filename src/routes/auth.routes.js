import express from 'express';
import {
    sendOtp,
    authUser,
} from '../controllers/auth.controller.js';

const router = express.Router();

/*
    * @api http://localhost:3000/api/v1/auth/send-otp
    * @method POST
    * @accept phoneNumber in body
    * @return otp to user phone number
*/
router.post('/send-otp', sendOtp);      

/*
    * @api http://localhost:3000/api/v1/auth/authentication
    * @method POST
    * @accept phoneNumber and otp in body
    * @return user data and token
*/
router.post('/authentication', authUser);

/*
    * @api http://localhost:3000/api/v1/auth/google
    * @method POST
    * @WORKING ON IT
*/
// router.post('/google', googleSignIn);         


export default router;
