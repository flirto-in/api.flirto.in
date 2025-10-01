import express from 'express';
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
    .post(createRoom);  // POST /rooms

router.route('/:id')
    .get(getRoom)       // GET /rooms/:id
    .put(updateRoom)    // PUT /rooms/:id
    .delete(deleteRoom); // DELETE /rooms/:id

// Room member management routes
router.post('/:id/members', manageRoomMembers); // POST /rooms/:id/members
router.get('/:id/members', getRoomMembers);     // GET /rooms/:id/members

export default router;
