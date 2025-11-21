import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional for public rooms
        roomId: { type: String }, // For public rooms like 'public_temp'

        // For non-encrypted or backward compatibility
        text: { type: String },

        // For E2E encryption
        encryptedText: { type: String },
        iv: { type: String }, // Initialization vector
        encryptedSessionKey: { type: String }, // Session key encrypted with receiver's public key

        // Message status
        pending: { type: Boolean, default: false },
        deliveryStatus: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
        },
        read: { type: Boolean, default: false },
        readAt: { type: Date },

        // Message type
        messageType: {
            type: String,
            enum: ['text', 'image', 'video', 'file', 'audio'],
            default: 'text'
        },

        // Media URL for non-text messages
        mediaUrl: { type: String },

        // Reactions
        reactions: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: { type: String },
            timestamp: { type: Date, default: Date.now }
        }],

        // Soft delete
        deleted: { type: Boolean, default: false },
        deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        deletedAt: { type: Date },

        // Self-destruct settings
        selfDestruct: {
            enabled: { type: Boolean, default: false },
            expiresAt: { type: Date }, // When message should auto-delete
            ttlSeconds: { type: Number }, // Time-to-live in seconds
            deletedAt: { type: Date } // When message was actually deleted
        },

        // Ephemeral / Temp session
        ephemeral: { type: Boolean, default: false }, // true if belongs to temp session and should be purged when session ends
        tempSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "TempSession" }, // reference to temp session
    },
    { timestamps: true }
);

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ deliveryStatus: 1, read: 1 });
messageSchema.index({ roomId: 1, createdAt: -1 }); // For public rooms
messageSchema.index({ 'selfDestruct.expiresAt': 1 }, { partialFilterExpression: { 'selfDestruct.enabled': true } }); // TTL index
messageSchema.index({ ephemeral: 1, tempSessionId: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
