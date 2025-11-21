import express from 'express';
import {
    sendOtp,
    authUser,
    tempSession,
} from '../controllers/auth.controller.js';

const router = express.Router();

/*
    * @api http://localhost:3000/api/v1/auth/send-otp
    * @method POST
    * @accept phoneNumber in body
    * @return otp sent to user phone number
*/
router.post('/send-otp', sendOtp);

/*
    * @api http://localhost:3000/api/v1/auth/authentication
    * @method POST
    * @accept phoneNumber and otp in body
    * @return user data and access token
*/
router.post('/authentication', authUser);        

/*
    * @api http://localhost:3000/api/v1/auth/temp-session
    * @method POST
    * @return temporary user and access token
*/
router.post('/temp-session', tempSession);

export default router;
