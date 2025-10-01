import mongoose from 'mongoose';
const { Schema } = mongoose;

const PostSchema = new Schema({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],       
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
}, {
    timestamps: true
});

export const Post = mongoose.model('Post', PostSchema);
