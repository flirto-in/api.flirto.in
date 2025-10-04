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
    .get(verifyJWT , getPost)       // GET http://localhost:3000/api/v1/posts/:id
    .put(verifyJWT , updatePost)    // PUT http://localhost:3000/api/v1/posts/:id
    .delete(verifyJWT , deletePost); // DELETE http://localhost:3000/api/v1/posts/:id

// Post interaction routes
router.post('/:id/like', verifyJWT , likePost);           // POST http://localhost:3000/api/v1/posts/:id/like
router.post('/:id/comment', verifyJWT , addCommentToPost); // POST http://localhost:3000/api/v1/posts/:id/comment
router.get('/:id/comments', verifyJWT , getPostComments); // GET http://localhost:3000/api/v1/posts/:id/comments

export default router;
