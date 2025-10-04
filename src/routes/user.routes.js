import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    getUserProfile,
    updateUserProfile,
    deleteUser,
    getUserSearchHistory,
    updateUserTags,
    getUserPosts,
    getUserRooms,
    verifyUser,
    updatePremiumSubscription
} from '../controllers/user.controller.js';

const router = express.Router();

// User profile routes
router.get('/:id', verifyJWT, getUserProfile)      //  http://localhost:3000/api/v1/users/:id

router.patch('/:id', verifyJWT, updateUserProfile)   //  http://localhost:3000/api/v1/users/:id

// User search history route
router.get('/:id/search-history', verifyJWT, getUserSearchHistory);  //  http://localhost:3000/api/v1/users/:id/search-history

// User tags/interests route
router.post('/:id/tags', verifyJWT, updateUserTags);  //  http://localhost:3000/api/v1/users/:id/tags

// User posts route
router.get('/:id/posts', verifyJWT, getUserPosts);  //  http://localhost:3000/api/v1/users/:id/posts

// User rooms route
router.get('/:id/rooms', verifyJWT, getUserRooms);  //  http://localhost:3000/api/v1/users/:id/rooms

// User verification route
router.post('/:id/verify', verifyJWT, verifyUser);  //  http://localhost:3000/api/v1/users/:id/verify

// User premium subscription route
router.put('/:id/premium', verifyJWT, updatePremiumSubscription);  //  http://localhost:3000/api/v1/users/:id/premium

export default router;
