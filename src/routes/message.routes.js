import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    searchUserByUid,
    getChats,
    getMessages
} from '../controllers/message.controller.js';

const router = express.Router();

/*
    * @api http://localhost:3000/api/v1/messages/search
    * @method GET
    * @accept query param: U_Id, auth token from headers
    * @return user info if found
*/
router.get('/search', verifyJWT, searchUserByUid);

/*
    * @api http://localhost:3000/api/v1/messages/all
    * @method GET
    * @accept auth token from headers
    * @return list of all chats (primary + secondary)
*/
router.get('/all', verifyJWT, getChats);

/*
    * @api http://localhost:3000/api/v1/messages/:userId/messages
    * @method GET
    * @accept userId from path params, auth token from headers
    * @return list of messages with specific user
*/
router.get('/:userId/messages', verifyJWT, getMessages);

export default router;
