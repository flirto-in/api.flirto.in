import { Comment } from '../models/Comment.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// POST /comments → Create comment (could be part of post)
export const createComment = asyncHandler(async (req, res) => {
    const { content, author, post } = req.body;
    
    // TODO: Implement business logic to create a comment
    // Example: const comment = await Comment.create({ content, author, post });
    
    res.status(201).json(
        new ApiResponse(201, {}, "Comment created successfully")
    );
});

// GET /comments/:id → Get comment by id
export const getComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // TODO: Implement business logic to get a comment by id
    // Example: const comment = await Comment.findById(id).populate('author post');
    
    res.status(200).json(
        new ApiResponse(200, {}, "Comment retrieved successfully")
    );
});

// PUT /comments/:id → Update comment
export const updateComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // TODO: Implement business logic to update a comment
    // Example: const comment = await Comment.findByIdAndUpdate(id, updateData, { new: true });
    
    res.status(200).json(
        new ApiResponse(200, {}, "Comment updated successfully")
    );
});

// DELETE /comments/:id → Delete comment
export const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // TODO: Implement business logic to delete a comment
    // Example: await Comment.findByIdAndDelete(id);
    
    res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});
