import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.models.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        throw new ApiError(401, 'Access token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Invalid or expired token');
    }

    if (!decoded?._id || !mongoose.Types.ObjectId.isValid(decoded._id)) {
        throw new ApiError(401, 'Invalid token payload');
    }

    const user = await User.findById(decoded._id).select('-refreshToken');
    if (!user) {
        throw new ApiError(401, 'User not found for this token');
    }

    req.user = user;
    next();
});


