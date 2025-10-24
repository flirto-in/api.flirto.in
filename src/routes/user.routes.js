import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    getUserProfile,
    updateUserProfile,
    getUserPrimaryChat,
    getUserSecondaryChat,
    updateUserChat,
    acceptChatRequest
} from '../controllers/user.controller.js';

const router = express.Router();

/*
    * @api http://localhost:3000/api/v1/users/:id
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return user profile data 
*/
router.get('/:id', verifyJWT, getUserProfile);

/*
    * @api http://localhost:3000/api/v1/users/:id
    * @method PATCH
    * @accept userId from path params and auth token from headers
    * @accept body: {U_Id, description}
    * @return updated user profile data
*/
router.patch('/:id', verifyJWT, updateUserProfile);

/*
    * @api http://localhost:3000/api/v1/users/:id/primaryChat
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return list of primary chats (sent by user)
*/
router.get('/:id/primaryChat', verifyJWT, getUserPrimaryChat);

/*
    * @api http://localhost:3000/api/v1/users/:id/secondaryChat
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return list of secondary chats (received or pending)
*/
router.get('/:id/secondaryChat', verifyJWT, getUserSecondaryChat);

/*
    * @api http://localhost:3000/api/v1/users/:id/chat/:chatId
    * @method PATCH
    * @accept userId and chatId from path params, auth token from headers
    * @accept body: {primaryChat, secondaryChat}
    * @return updated user chat info
*/
router.patch('/:id/chat/:chatId', verifyJWT, updateUserChat);


router.post('/:id/accept/:requesterId', verifyJWT, acceptChatRequest);


export default router;
