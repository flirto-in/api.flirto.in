import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    createRoom,
    getRoom,
    updateRoom,
    deleteRoom,
    manageRoomMembers,
    getRoomMembers
} from '../controllers/room.controller.js';

const router = express.Router();

// Room routes
router.route('/')
    .post(verifyJWT , createRoom);  // POST /rooms

router.route('/:id')
    .get(verifyJWT , getRoom)       // GET /rooms/:id
    .put(verifyJWT , updateRoom)    // PUT /rooms/:id
    .delete(verifyJWT , deleteRoom); // DELETE /rooms/:id

// Room member management routes
router.post('/:id/members', verifyJWT , manageRoomMembers); // POST /rooms/:id/members
router.get('/:id/members', verifyJWT , getRoomMembers);     // GET /rooms/:id/members

export default router;
