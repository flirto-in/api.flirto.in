import express from 'express';
import {
    createPost,
    getPost,
    updatePost,
    deletePost,
    likePost,
    addCommentToPost,
    getPostComments
} from '../controllers/post.controller.js';

const router = express.Router();

// Post routes
router.route('/')
    .post(createPost);  // POST /posts

router.route('/:id')
    .get(getPost)       // GET /posts/:id
    .put(updatePost)    // PUT /posts/:id
    .delete(deletePost); // DELETE /posts/:id

// Post interaction routes
router.post('/:id/like', likePost);           // POST /posts/:id/like
router.post('/:id/comment', addCommentToPost); // POST /posts/:id/comment
router.get('/:id/comments', getPostComments); // GET /posts/:id/comments

export default router;
