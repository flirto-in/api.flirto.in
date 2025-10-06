import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    createPost,
    getPostsByUser,
    deletePost,
    likePost,
    getAllPosts
} from '../controllers/post.controller.js';

const router = express.Router();

/**
    * @api http://localhost:3000/api/v1/posts
    * @method POST
    * @accept post content
    * @return suscess message 
*/
router.route('/').post(verifyJWT, createPost);

/**
    * @api GET http://localhost:3000/api/v1/posts/user/{id}
    * @method GET
    * @accept userID from body
    * @return all post objects id of user 
*/
router.get('/user/:id', verifyJWT, getPostsByUser);

/**
    * @api GET http://localhost:3000/api/v1/posts/{id}
    * @method DELETE
    * @accept postID from path params 
    * @return success message
*/
router.route('/:id').delete(verifyJWT, deletePost);

/**
    * @api GET http://localhost:3000/api/v1/posts/{id}/like
    * @method POST
    * @accept postID from path params 
    * @return success message
*/
router.post('/:id/like', verifyJWT, likePost);

/**
    * @api GET http://localhost:3000/api/v1/posts/AllPosts
    * @method GET
    * @accept nothing
    * @return all post objects id
*/
router.get('/AllPosts', verifyJWT, getAllPosts);

export default router;
