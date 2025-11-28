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

// Send OTP (fixed "7962" for Play Store review builds)
const sendOtp = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) throw new ApiError(400, "Phone number is required");

    // Fixed OTP for Play Store review: Phone 9852041676, OTP 7962
    const otp = "7962";

    // TODO: send otp via SMS (Twilio or other service)
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
});

// Generate UID in AA111A format (2 uppercase letters + 3 digits + 1 uppercase letter)
const generateUID = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = () => letters[Math.floor(Math.random() * letters.length)];
    const randomDigits = () => Math.floor(100 + Math.random() * 900); // 3 digits: 100-999
    return `${randomLetter()}${randomLetter()}${randomDigits()}${randomLetter()}`;
};

// Register or Login (Single device: auto-logout on other devices)
const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, otp, deviceId } = req.body;
    if (!phoneNumber) throw new ApiError(400, "Phone number is required");
    if (!otp) throw new ApiError(400, "OTP is required");
    if (otp !== "7962") throw new ApiError(401, "Invalid OTP"); // Fixed OTP for Play Store review

    let user = await User.findOne({ phoneNumber });

    if (!user) {
        const U_Id = generateUID(); // Format: AA111A
        user = await User.create({ phoneNumber, U_Id });
    }

    // Single device login: store current deviceId and emit logout to previous device
    const previousDeviceId = user.currentDeviceId;
    const newDeviceId = deviceId || `device_${Date.now()}`;
    
    const accessToken = generateAccessToken(user);
    user.accessToken = accessToken;
    user.currentDeviceId = newDeviceId;
    await user.save();

    // If user was logged in on another device, notify that device to logout
    if (previousDeviceId && previousDeviceId !== newDeviceId) {
        // Socket will handle the logout emission
        console.log(`🔄 User ${user.U_Id} logged in on new device. Previous device will be logged out.`);
    }

    return res.status(200).json(
        new ApiResponse(200, { accessToken, user, previousDeviceId }, "Authentication successful")
    );
});

// Create a temporary anonymous session (guest user)
const tempSession = asyncHandler(async (req, res) => {
    // Create a unique temporary phoneNumber to satisfy schema uniqueness
    const tempPhone = `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const U_Id = `GT${Math.floor(100 + Math.random() * 900)}G`; // Format: GT111G for guests
    const user = await User.create({ phoneNumber: tempPhone, U_Id, description: 'Temporary guest session' });

    const accessToken = generateAccessToken(user);
    user.accessToken = accessToken;
    await user.save();

    return res.status(200).json(new ApiResponse(200, { accessToken, user }, 'Temporary session created'));
});

export { sendOtp, authUser, tempSession };
