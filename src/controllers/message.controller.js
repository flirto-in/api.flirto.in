import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Message } from '../models/Message.models.js';
import { User } from '../models/User.models.js';

// Search users by U_Id
export const searchUserByUid = asyncHandler(async (req, res) => {
    const { uid } = req.query;
    if (!uid) throw new ApiError(400, "U_Id is required");

    const user = await User.findOne({ U_Id: uid }).select('_id U_Id description');
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, { user }));
});

// Get all chats for a user (primary + secondary)
export const getChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
        .populate('primaryChat', 'U_Id description online lastSeen')
        .populate('secondaryChat', 'U_Id description online lastSeen');

    return res.status(200).json(new ApiResponse(200, {
        primaryChat: user.primaryChat,      
        secondaryChat: user.secondaryChat   
    }));
});


// Get messages between two users
export const getMessages = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
        $or: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
        ]
    }).sort({ createdAt: 1 });

    return res.status(200).json(new ApiResponse(200, { messages }));
});