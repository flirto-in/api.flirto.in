import dotenv from "dotenv";
dotenv.config();
import { User } from '../models/User.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

// Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        { _id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
    );
};

// Send OTP (dev = "6969")
const sendOtp = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) throw new ApiError(400, "Phone number is required");

    // const otp = process.env.NODE_ENV === "devlopment"
    //     ? Math.floor(1000 + Math.random() * 9000).toString()
    //     : "6969";

        const otp = "6969";


    return res.status(200).json(new ApiResponse(200, { otp }, "OTP sent successfully"));
});

// Real Google ID token verification helper
// const verifyGoogleIdToken = async (idToken) => {
//     if (!googleClientId) {
//         console.log(googleClientId);

//         throw new ApiError(500, "GOOGLE_CLIENT_ID is fuck you");
//     }
//     const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId });
//     const payload = ticket.getPayload();
//     const { emai picture, sub } = payload;
//     if (!email || !sub) {
//         throw new ApiError(401, "Invalid Google token payload");
//     }
//     return { email, name, picture, googleId: sub };
// };

// const googleSignIn = asyncHandler(async (req, res) => {
//     const { idToken } = req.body;

//     if (!googleClientId) {
//         throw new ApiError(500, 'Server misconfiguration: GOOGLE_CLIENT_ID is missing');
//     }

//     if (!idToken) {
//         throw new ApiError(400, 'ID token is required');
//     }

//     try {
//         const ticket = await googleClient.verifyIdToken({
//             idToken,
//             audience: googleClientId,
//         });

//         const payload = ticket.getPayload();
//         const { email, name, picture, sub: googleId } = payload;

//         if (!email) {
//             throw new ApiError(400, 'Google token missing email');
//         }

//         let user = await User.findOne({ email });

//         if (!user) {
//             const U_Id = `U_${Date.now()}`;
//             user = await User.create({
//                 email,
//                 U_Id,
//                 isVerified: true,
//                 description: '',
//                 tags: [],
//                 interests: [],
//             });
//         }

//         const accessToken = generateAccessToken(user);

//         return res.status(200).json(new ApiResponse(200, {
//             accessToken,
//             user,
//             profile: { name, picture, googleId },
//         }, 'Google sign-in successful'));
//     } catch (error) {
//         console.error('Google sign-in error:', error);
//         throw new ApiError(401, 'Invalid ID token');
//     }
// });

// Main auth function (register + login) with Google verification and OTP flow
const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, otp } = req.body;
    // const { phoneNumber, otp, idToken } = req.body;

    if (!phoneNumber) throw new ApiError(400, "Phone number is required");
    // if (!idToken) throw new ApiError(400, "Google ID token is required");

    // Verify Google token and extract profile
    // const { email, name, picture, googleId } = await verifyGoogleIdToken(idToken);

    // Step 1: Check if user exists by phone number
    let user = await User.findOne({ phoneNumber });

    if (user) {
        // Existing: enforce email and googleId match
        //     if (user.email !== email) {
        //         throw new ApiError(401, "Wrong Gmail for this number");
        //     }
        //     if (user.googleId && user.googleId !== googleId) {
        //         throw new ApiError(401, "Google account mismatch for this user");
        //     }

        // if (!googleId) {
        //     throw new ApiError(400, "Google ID is required");
        // }

        if (!otp) throw new ApiError(400, "OTP is required");
        if (otp !== "6969") throw new ApiError(401, "Invalid OTP");

        const accessToken = generateAccessToken(user);
        return res.status(200).json(new ApiResponse(200, { accessToken, user }, "Login successful via Google"));
    }

    // New user path: require OTP (dev: 6969)
    if (!otp) throw new ApiError(400, "OTP is required");
    if (otp !== "6969") throw new ApiError(401, "Invalid OTP");

    // Create new user with verified Google identity
    const U_Id = `U_${Date.now()}`;
    user = await User.create({
        phoneNumber,
        // email,
        // googleId,
        // picture,
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
    logoutUser,
    authUser,
    // googleSignIn
};
