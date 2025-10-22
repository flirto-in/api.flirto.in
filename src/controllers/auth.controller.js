import dotenv from "dotenv";
dotenv.config();
import { User } from '../models/User.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

// Generate Access Token
const generateAccessToken = (user) => {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error("ACCESS_TOKEN_SECRET not defined in environment");
    }

    return jwt.sign(
        { id: user._id},
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
    );
};

// Send OTP (dev = "6969")
const sendOtp = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) throw new ApiError(400, "Phone number is required");

    const otp = process.env.NODE_ENV === "development"
        ? "6969"
        : Math.floor(1000 + Math.random() * 9000).toString();

    // TODO: send otp via SMS (Twilio or other service)
    return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
});

// Register or Login
const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber) throw new ApiError(400, "Phone number is required");
    if (!otp) throw new ApiError(400, "OTP is required");
    if (otp !== "6969") throw new ApiError(401, "Invalid OTP");

    let user = await User.findOne({ phoneNumber });

    if (!user) {
        const U_Id = `U_${Date.now()}`;
        user = await User.create({ phoneNumber, U_Id });
    }

    const accessToken = generateAccessToken(user);
    user.accessToken = accessToken;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, { accessToken, user }, "Authentication successful")
    );
});

export { sendOtp, authUser };
