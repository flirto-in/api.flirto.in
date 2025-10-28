import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    sendMessage,
    searchUserByUid,
    getChats,
    getMessages,
    deleteMessageForMe,
    deleteMessageForEveryone
} from '../controllers/message.controller.js';

const router = express.Router();

/**
 * @api http://localhost:3000/api/v1/messages/send
 * @method POST
 * @accept body: { receiverId, text?, encryptedText?, iv?, encryptedSessionKey?, messageType?, mediaUrl? }
 * @accept auth token from headers
 * @return sent message object
 */
router.post('/send', verifyJWT, sendMessage);

/**
 * @api http://localhost:3000/api/v1/messages/search
 * @method GET
 * @accept query param: uid (U_Id), auth token from headers
 * @return user info if found
 */
router.get('/search', verifyJWT, searchUserByUid);

/**
 * @api http://localhost:3000/api/v1/messages/all
 * @method GET
 * @accept auth token from headers
 * @return list of all chats (primary + secondary)
 */
router.get('/all', verifyJWT, getChats);

/**
 * @api http://localhost:3000/api/v1/messages/:userId/messages
 * @method GET
 * @accept userId from path params, auth token from headers
 * @return list of messages with specific user
 */
router.get('/:userId/messages', verifyJWT, getMessages);

/**
 * @api http://localhost:3000/api/v1/messages/:messageId/delete-for-me
 * @method DELETE
 * @accept messageId from path params, auth token from headers
 * @return success message
 */
router.delete('/:messageId/delete-for-me', verifyJWT, deleteMessageForMe);

/**
 * @api http://localhost:3000/api/v1/messages/:messageId/delete-for-everyone
 * @method DELETE
 * @accept messageId from path params, auth token from headers
 * @return success message (only sender can delete, within 1 hour)
 */
router.delete('/:messageId/delete-for-everyone', verifyJWT, deleteMessageForEveryone);

export default router;
