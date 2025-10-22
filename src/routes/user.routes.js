import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    getUserProfile,
    updateUserProfile,
} from '../controllers/user.controller.js';

const router = express.Router();

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return user profile data 
*/
router.get('/:id', verifyJWT, getUserProfile)

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method PATCH
    * @accept userId from path params and auth token from headers and user profile data from body {U_Id , description, tags, interests}
    * @return updated user profile data
*/
router.patch('/:id', verifyJWT, updateUserProfile)

// GET /users/:id/primaryChat → Get primaryChat
router.get('/:id/primaryChat', verifyJWT, getUserPrimaryChat)

// GET /users/:id/secondaryChat → Get secondaryChat
router.get('/:id/secondaryChat', verifyJWT, getUserSecondaryChat)

// PATCH /users/:id/chat/:chatId → Update primary and secondary Chat
router.patch('/:id/chat/:chatId', verifyJWT, updateUserChat)

export default router;
