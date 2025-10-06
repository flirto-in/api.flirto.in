import { Post } from '../models/Post.models.js';
import { User } from '../models/User.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from "mongoose";

// POST /posts → Create post 
export const createPost = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const userId = req.user._id;

    const post = await Post.create({ content, createdBy: userId });

    await User.findByIdAndUpdate(userId, {
        $push: { posts: post._id }
    });


    res.status(201).json(
        new ApiResponse(201, {}, "Post created successfully")
    );
});

// GET /posts/:id → Get post by user
export const getPostsByUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(id).populate('posts');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const posts = await Post.find({ createdBy: id })
        .populate("createdBy", "U_Id description tags") // select specific fields
        .populate("likes", "U_Id")
        .sort({ createdAt: -1 }); // newest first

    if (!posts || posts.length === 0) {
        throw new ApiError(404, "This user has no posts yet");
    }

    res.status(200).json(
        new ApiResponse(200, { posts }, "User posts retrieved successfully")
    );
});

// DELETE /posts/:id → Delete post
export const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    await User.findByIdAndUpdate(post.createdBy, {
        $pull: { posts: post._id }
    });

    res.status(200).json(
        new ApiResponse(200, {}, "Post deleted successfully")
    );
});


// POST /posts/:userId/:postId/like → Like/Unlike post
export const likePost = asyncHandler(async (req, res) => {
    const { id: userId, postId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid postId or userId format");
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // Check post exists
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    // Initialize likes array
    if (!post.likes) post.likes = [];

    // Toggle like/unlike
    const alreadyLiked = post.likes.some(uid => uid.toString() === userId.toString());
    if (alreadyLiked) {
        post.likes = post.likes.filter(uid => uid.toString() !== userId.toString());
        await post.save();
        return res.status(200).json(new ApiResponse(200, {}, "Post unliked successfully"));
    } else {
        post.likes.push(userId);
        await post.save();
        return res.status(200).json(new ApiResponse(200, {}, "Post liked successfully"));
    }
});


export const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find()
        .populate('createdBy')
        .populate('likes');
    res.status(200).json(
        new ApiResponse(200, { posts }, "Posts retrieved successfully")
    );
});