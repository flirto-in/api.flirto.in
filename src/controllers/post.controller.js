import { Post } from '../models/Post.models.js';
import { User } from '../models/User.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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
        new ApiResponse(201, { post }, "Post created successfully")
    );
});

// GET /posts/:id → Get single post
export const getPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id)
        .populate('createdBy')
        .populate('likes')
        .populate({
            path: 'comments',
            populate: {
                path: 'author'
            }
        });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    res.status(200).json(
        new ApiResponse(200, { post }, "Post retrieved successfully")
    );
});

// PUT /posts/:id → Update post
export const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const post = await Post.findByIdAndUpdate(id, updateData, { new: true });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    res.status(200).json(
        new ApiResponse(200, { post }, "Post updated successfully")
    );
});

// DELETE /posts/:id → Delete post
export const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    res.status(200).json(
        new ApiResponse(200, {}, "Post deleted successfully")
    );
});

// POST /posts/:id/like → Like post
export const likePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    // find post
    const post = await Post.findById(id);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // initialize likes array if undefined
    if (!post.likes) post.likes = [];

    // check if user has already liked
    const index = post.likes.indexOf(userId);
    if (index === -1) {
        // not liked yet, add userId
        post.likes.push(userId);
        await post.save();
        return res.status(200).json(new ApiResponse(200, {}, "Post liked successfully"));
    } else {
        // already liked, remove userId
        post.likes.splice(index, 1);
        await post.save();
        return res.status(200).json(new ApiResponse(200, {}, "Post unliked successfully"));
    }
});


// POST /posts/:id/comment → Add comment to post
export const addCommentToPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, author } = req.body;

    // TODO: Implement business logic to add a comment to a post
    // Example: const comment = await Comment.create({ content, author, post: id });

    res.status(201).json(
        new ApiResponse(201, {}, "Comment added successfully")
    );
});

// GET /posts/:id/comments → Get all comments
export const getPostComments = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // TODO: Implement business logic to get all comments for a post
    // Example: const comments = await Comment.find({ post: id }).populate('author');

    res.status(200).json(
        new ApiResponse(200, {}, "Comments retrieved successfully")
    );
});
