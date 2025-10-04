import { DailyAsk } from '../models/DailyAsk.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /daily-ask/:userId → Get daily questions
export const getDailyQuestions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // TODO: Implement business logic to get daily questions for a user
    // Example: const dailyAsk = await DailyAsk.findOne({ user: userId, date: new Date() });
    
    res.status(200).json(
        new ApiResponse(200, {}, "Daily questions retrieved successfully")
    );
});

// POST /daily-ask/:userId → Save answers
export const saveDailyAnswers = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { answers } = req.body;
    
    // TODO: Implement business logic to save daily answers
    // Example: const dailyAsk = await DailyAsk.create({ user: userId, answers, date: new Date() });
    
    res.status(201).json(
        new ApiResponse(201, {}, "Daily answers saved successfully")
    );
});