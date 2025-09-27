const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    attachments: [{ type: String }],
    expireAt: { type: Date, index: { expireAfterSeconds: 0 } }
}, { timestamps: true });

// When creating a message, set expireAt = createdAt + duration
MessageSchema.pre('save', function (next) {
    if (!this.expireAt) {
        const hours = this.duration || 3; // fallback 3h if not set
        this.expireAt = new Date(this.createdAt.getTime() + hours * 60 * 60 * 1000);
    }
    next();
});

module.exports = mongoose.model('Message', MessageSchema);
