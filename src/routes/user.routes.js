import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    getUserProfile,
    updateUserProfile,
    getUserPrimaryChat,
    getUserSecondaryChat,
    updateUserChat,
    acceptChatRequest,
    me,
    blockUser,
    unblockUser,
    getBlockedUsers
} from '../controllers/user.controller.js';

const router = express.Router();


//  ### @api http://localhost:3000/api/v1/users/me    ✅
//     ### @method GET
//     ### @accept auth token from headers
//     ### @return user current profile data
router.get('/me', verifyJWT, me);

/**
    * @api http://localhost:3000/api/v1/users/:U_id
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return user profile data 
*/
router.get('/:U_id', verifyJWT, getUserProfile);

/*
    * @api http://localhost:3000/api/v1/users/updateUserProfile
    * @method PATCH
    * @accept userId from path params and auth token from headers
    * @accept body: {description}
    * @return updated user profile data
*/
router.patch('/updateUserProfile', verifyJWT, updateUserProfile);

/*
    * @api http://localhost:3000/api/v1/users/primaryChat
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return list of primary chats (sent by user)
*/
router.get('/primaryChat', verifyJWT, getUserPrimaryChat);

/*
    * @api http://localhost:3000/api/v1/users/secondaryChat
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return list of secondary chats (received or pending)
*/
router.get('/secondaryChat', verifyJWT, getUserSecondaryChat);

/*
    * @api http://localhost:3000/api/v1/users/chat/:chatId
    * @method PATCH
    * @accept userId and chatId from path params, auth token from headers
    * @accept body: {primaryChat, secondaryChat}
    * @return updated user chat info
*/
router.patch('/chat/:chatId', verifyJWT, updateUserChat);


router.post('/accept/:requesterId', verifyJWT, acceptChatRequest);


// Block/Unblock
router.post('/block/:userId', verifyJWT, blockUser);
router.post('/unblock/:userId', verifyJWT, unblockUser);
router.get('/blocked', verifyJWT, getBlockedUsers);


// POST /users/push-token
// Save push token to user's device array
router.post('/push-token', verifyJWT, async (req, res) => {
    const { pushToken } = req.body;
    const userId = req.user._id;

    // Add pushToken to user's deviceKeys array if not exists
    await User.findByIdAndUpdate(userId, {
        $addToSet: { deviceKeys: pushToken }
    });

    res.json({ success: true });
});

export default router;
