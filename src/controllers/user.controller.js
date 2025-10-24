import mongoose from 'mongoose';
import { User } from '../models/User.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /users/:U_id → Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
    const { U_Id } = req.params; 

    if (!U_Id) {
        throw new ApiError(400, "U_Id is required");
    }

    const user = await User.findOne({ U_Id })
        .select('-__v');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { user }, "User profile retrieved successfully")
    );
});


// GET /users/me → Get cureent user profile
export const me = asyncHandler(async (req, res) => {
    const id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id)
        .select('-__v')

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { user }, "User profile retrieved successfully")
    );
});

// PUT /users → Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
    const updateData = req.body;
    const id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const allowedFields = ['description'];
    const sanitizedUpdate = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );

    const user = await User.findByIdAndUpdate(id, sanitizedUpdate, { new: true })
        .select('-__v ');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { user }, "User profile updated successfully"));
});


// todo changes in req.user._id


// GET /users/:id/primaryChat → Get primaryChat
export const getUserPrimaryChat = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id)
        .populate('primaryChat', '-__v');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { primaryChat: user.primaryChat }, "User primary chat retrieved successfully")
    );
});

// GET /users/:id/secondaryChat → Get secondaryChat
export const getUserSecondaryChat = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id)
        .populate('secondaryChat', 'content createdAt');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { secondaryChat: user.secondaryChat }, "User secondary chat retrieved successfully")
    );
});

// GET /users/:id/chat/:chatId → Update primary and secondary Chat
export const updateUserChat = asyncHandler(async (req, res) => {
    const { id, chatId } = req.params;
    const { primaryChat, secondaryChat } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid user ID or chat ID");
    }

    const user = await User.findByIdAndUpdate(id, { primaryChat, secondaryChat }, { new: true })
        .select('-__v ');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { user }, "User chat updated successfully")
    );
});

// POST /users/:id/accept/:requesterId
export const acceptChatRequest = asyncHandler(async (req, res) => {
    const { id, requesterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requesterId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id);
    const requester = await User.findById(requesterId);

    if (!user || !requester) throw new ApiError(404, "User not found");

    // Remove from secondaryChat
    user.secondaryChat = user.secondaryChat.filter(u => u.toString() !== requesterId);
    // Add to primaryChat if not already
    if (!user.primaryChat.includes(requesterId)) user.primaryChat.push(requesterId);
    await user.save();

    // Add to sender's primaryChat if not already
    if (!requester.primaryChat.includes(id)) {
        requester.primaryChat.push(id);
        await requester.save();
    }

    res.status(200).json({ message: "Chat request accepted", primaryChat: user.primaryChat });
});
