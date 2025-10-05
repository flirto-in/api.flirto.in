import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    createPost,
    getPost,
    updatePost,
    deletePost,
    likePost,
    getAllPosts
} from '../controllers/post.controller.js';

const router = express.Router();

/*
    * @api http://localhost:3000/api/v1/posts
    * @method GET
    * @accept post content
    * @return post data
*/
router.route('/').post(verifyJWT, createPost);

router.route('/:id')
    /*
        * @api GET http://localhost:3000/api/v1/posts/{id}
        * @method GET
        * @accept postID from path params  and post content
        * @return post single data
    */
    .get(verifyJWT, getPost)
    /*
        * @api GET http://localhost:3000/api/v1/posts/{id}
        * @method PUT
        * @accept postID from path params and content from body
        * @return post data
    */
    .put(verifyJWT, updatePost)
    /*
        * @api GET http://localhost:3000/api/v1/posts/{id}
        * @method DELETE
        * @accept postID from path params 
        * @return success message
    */
    .delete(verifyJWT, deletePost);

/*
    * @api GET http://localhost:3000/api/v1/posts/{id}/like
    * @method POST
    * @accept postID from path params 
    * @return success message
*/
router.post('/:id/like', verifyJWT, likePost);

/*
    * @api GET http://localhost:3000/api/v1/posts/{id}/like
    * @method POST
    * @accept postID from path params 
    * @return success message
*/
router.post('/:id/like', verifyJWT, likePost);

/*
    * @api GET http://localhost:3000/api/v1/posts/AllPosts
    * @method GET
    * @accept userID from body
    * @return all post objects id
*/
router.get('/AllPosts', verifyJWT, getAllPosts);

export default router;
