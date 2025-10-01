import express from 'express';
import {
    getDailyQuestions,
    saveDailyAnswers,
    updateDailyAnswers
} from '../controllers/dailyAsk.controller.js';

const router = express.Router();

// Daily Ask routes
router.route('/:userId')
    .get(getDailyQuestions)     // GET /daily-ask/:userId
    .post(saveDailyAnswers)     // POST /daily-ask/:userId
    .put(updateDailyAnswers);   // PUT /daily-ask/:userId

export default router;
