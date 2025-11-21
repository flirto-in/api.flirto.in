import express from 'express';
import { createTempSession, joinTempSession, getTempSessionMessages, endTempSession } from '../controllers/tempSession.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/session', verifyJWT, createTempSession);
router.post('/session/join', verifyJWT, joinTempSession);
router.get('/session/:id/messages', verifyJWT, getTempSessionMessages);
router.post('/session/:id/end', verifyJWT, endTempSession);

export default router;