import mongoose from 'mongoose';
import { User } from '../models/User.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /users/:id → Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id)
        .select('-__v -refreshToken')
        .populate('posts', 'content createdAt')
        .populate('rooms', 'name description');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { user }, "User profile retrieved successfully")
    );
});


// PUT /users/:id → Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const allowedFields = ['description', 'tags', 'interests'];
    const sanitizedUpdate = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );

    const user = await User.findByIdAndUpdate(id, sanitizedUpdate, { new: true })
        .select('-__v -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { user }, "User profile updated successfully"));
});

// DELETE /users/:id → Delete user
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

// GET /users/:id/search-history → Get search history
export const getUserSearchHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id)
        .select('_id')
        .populate('searchHistory', 'email U_Id');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { searchHistory: user.searchHistory }, "Search history retrieved successfully"));
});

// POST /users/:id/tags → Add or update tags/interests
export const updateUserTags = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tags, interests } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findByIdAndUpdate(
        id,
        { ...(Array.isArray(tags) ? { tags } : {}), ...(Array.isArray(interests) ? { interests } : {}) },
        { new: true }
    ).select('-__v -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { user }, "Tags and interests updated successfully"));
});

// GET /users/:id/posts → Get all posts of a user
export const getUserPosts = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id).populate('posts');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { posts: user.posts }, "User posts retrieved successfully"));
});

// GET /users/:id/rooms → Get all rooms user is part of
export const getUserRooms = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id).populate('rooms');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { rooms: user.rooms }, "User rooms retrieved successfully"));
});

// POST /users/:id/verify → Verify user (e.g., OTP or Google Auth)
export const verifyUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { verificationCode, verificationType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findByIdAndUpdate(id, { isVerified: true }, { new: true }).select('-__v -refreshToken');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { user }, "User verified successfully"));
});

// PUT /users/:id/premium → Update premium subscription
export const updatePremiumSubscription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { premium } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findByIdAndUpdate(id, { premium }, { new: true }).select('-__v -refreshToken');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, { user }, "Premium subscription updated successfully"));
});
