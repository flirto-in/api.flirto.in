// models/Comment.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const CommentSchema = new Schema({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post' }
}, {
    timestamps: true
});

export const Comment = mongoose.model('Comment', CommentSchema);
