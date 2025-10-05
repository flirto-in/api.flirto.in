import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    getUserProfile,
    updateUserProfile,
    getUserSearchHistory,
    getUserPosts,
    getUserRooms,
    verifyUser,
    showPremiumSubscription
} from '../controllers/user.controller.js';

const router = express.Router();

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return user profile data
*/
router.get('/:id', verifyJWT, getUserProfile)

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method PATCH
    * @accept userId from path params and auth token from headers and user profile data from body {U_Id , description, tags, interests}
    * @return updated user profile data
*/
router.patch('/:id', verifyJWT, updateUserProfile)

/*
    * @api http://localhost:3000/api/v1/users/{userId}/search-history
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return user search history data which is array of user objects id
*/
router.get('/:id/search-history', verifyJWT, getUserSearchHistory);

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return user posts objects id
*/
router.get('/:id/posts', verifyJWT, getUserPosts); 

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method GET
    * @accept userId from path params and auth token from headers
    * @return user rooms objects id
*/
router.get('/:id/rooms', verifyJWT, getUserRooms);  

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method POST
    * @accept userId from path params and auth token from headers
    * @return user is vervified true/false
*/
router.post('/:id/verify', verifyJWT, verifyUser);  

/*
    * @api http://localhost:3000/api/v1/users/{userId}
    * @method GET
    * WORKING ON IT 
*/
router.put('/:id/premium', verifyJWT, showPremiumSubscription);

export default router;
