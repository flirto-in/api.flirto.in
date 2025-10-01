import express from 'express';
import {
    createComment,
    getComment,
    updateComment,
    deleteComment
} from '../controllers/comment.controller.js';

const router = express.Router();

// Comment routes
router.route('/')
    .post(createComment);  // POST /comments

router.route('/:id')
    .get(getComment)       // GET /comments/:id
    .put(updateComment)    // PUT /comments/:id
    .delete(deleteComment); // DELETE /comments/:id

export default router;
