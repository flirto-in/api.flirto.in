import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
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
    .post(verifyJWT , createPost);  // http://localhost:3000/api/v1/posts

router.route('/:id')
    .get(getPost)       // GET http://localhost:3000/api/v1/posts/:id
    .put(updatePost)    // PUT http://localhost:3000/api/v1/posts/:id
    .delete(deletePost); // DELETE http://localhost:3000/api/v1/posts/:id

// Post interaction routes
router.post('/:id/like', likePost);           // POST http://localhost:3000/api/v1/posts/:id/like
router.post('/:id/comment', addCommentToPost); // POST http://localhost:3000/api/v1/posts/:id/comment
router.get('/:id/comments', getPostComments); // GET http://localhost:3000/api/v1/posts/:id/comments

export default router;
