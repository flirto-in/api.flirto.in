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
router.route('/:id')
    .get(verifyJWT, getUserProfile)      // GET /users/:id
    .put(verifyJWT, updateUserProfile)   // PUT /users/:id
    .delete(verifyJWT, deleteUser);      // DELETE /users/:id

// User search history route
router.get('/:id/search-history', verifyJWT, getUserSearchHistory);  // GET /users/:id/search-history

// User tags/interests route
router.post('/:id/tags', verifyJWT, updateUserTags);  // POST /users/:id/tags

// User posts route
router.get('/:id/posts', verifyJWT, getUserPosts);  // GET /users/:id/posts
 
// User rooms route
router.get('/:id/rooms', verifyJWT, getUserRooms);  // GET /users/:id/rooms

// User verification route
router.post('/:id/verify', verifyJWT, verifyUser);  // POST /users/:id/verify

// User premium subscription route
router.put('/:id/premium', verifyJWT, updatePremiumSubscription);  // PUT /users/:id/premium

export default router;
