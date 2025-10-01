import { Room } from '../models/Rooms.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// POST /rooms → Create room
export const createRoom = asyncHandler(async (req, res) => {
    const { name, description, creator, type, isPrivate } = req.body;
    
    // TODO: Implement business logic to create a room
    // Example: const room = await Room.create({ name, description, creator, type, isPrivate });
    
    res.status(201).json(
        new ApiResponse(201, {}, "Room created successfully")
    );
});

// GET /rooms/:id → Get room details
export const getRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // TODO: Implement business logic to get room details
    // Example: const room = await Room.findById(id).populate('members creator');
    
    res.status(200).json(
        new ApiResponse(200, {}, "Room details retrieved successfully")
    );
});

// PUT /rooms/:id → Update room info
export const updateRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // TODO: Implement business logic to update room info
    // Example: const room = await Room.findByIdAndUpdate(id, updateData, { new: true });
    
    res.status(200).json(
        new ApiResponse(200, {}, "Room updated successfully")
    );
});

// DELETE /rooms/:id → Delete room
export const deleteRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // TODO: Implement business logic to delete a room
    // Example: await Room.findByIdAndDelete(id);
    
    res.status(200).json(
        new ApiResponse(200, {}, "Room deleted successfully")
    );
});

// POST /rooms/:id/members → Add/remove members
export const manageRoomMembers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId, action } = req.body; // action: 'add' or 'remove'
    
    // TODO: Implement business logic to add or remove members from room
    // Example: 
    // if (action === 'add') {
    //     await Room.findByIdAndUpdate(id, { $addToSet: { members: userId } });
    // } else if (action === 'remove') {
    //     await Room.findByIdAndUpdate(id, { $pull: { members: userId } });
    // }
    
    res.status(200).json(
        new ApiResponse(200, {}, `Member ${action}ed successfully`)
    );
});

// GET /rooms/:id/members → Get members
export const getRoomMembers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // TODO: Implement business logic to get room members
    // Example: const room = await Room.findById(id).populate('members');
    
    res.status(200).json(
        new ApiResponse(200, {}, "Room members retrieved successfully")
    );
});
