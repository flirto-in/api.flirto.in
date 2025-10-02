import { User } from '../models/User.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

// Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        { _id: user._id, phoneNumber: user.phoneNumber, email: user.email, U_Id: user.U_Id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
    );
};

// Send OTP (dev = "6969")
const sendOtp = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) throw new ApiError(400, "Phone number is required");

    const otp = process.env.NODE_ENV === "production"
        ? Math.floor(1000 + Math.random() * 9000).toString()
        : "6969";

    return res.status(200).json(new ApiResponse(200, { otp }, "OTP sent successfully"));
});

// Mock Google Auth verification (replace with real API)
const googleAuth = async (email, googleId) => {
    // if (!email || !googleId) return false;
    return true; // assume verified
};

// Main auth function (register + login)
const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, email, otp, googleId } = req.body;

    if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
    }

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    if (!googleId) {
        throw new ApiError(400, "Google ID is required");
    }

    // Step 1: Check if user exists
    let user = await User.findOne({ phoneNumber });

    if (user) {
        // Existing user → verify Gmail via Google Auth
        const isGoogleVerified = await googleAuth(email, googleId);
        if (!isGoogleVerified) throw new ApiError(401, "Google Auth failed");
        if (user.email !== email) throw new ApiError(401, "Wrong Gmail for this number");

        const accessToken = generateAccessToken(user);
        return res.status(200).json(new ApiResponse(200, { accessToken, user }, "Login successful via Google Auth"));
    }

    // Step 2: New user → verify OTP first
    if (!otp || otp !== "6969") throw new ApiError(401, "Invalid OTP");

    const isGoogleVerified = await googleAuth(email, googleId);
    if (!isGoogleVerified) throw new ApiError(401, "Google Auth failed");

    // Step 3: Register new user
    const U_Id = `U_${Date.now()}`;
    user = await User.create({
        phoneNumber,
        email,
        U_Id,
        isVerified: true,
        description: "",
        tags: [],
        interests: []
    });

    const accessToken = generateAccessToken(user);
    return res.status(201).json(new ApiResponse(201, { accessToken, user }, "User registered & logged in"));
});

// Logout 
const logoutUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "User logged out (client should clear token)"));
});

export {
    sendOtp,
    generateAccessToken,
    googleAuth,
    logoutUser,
    authUser
};
