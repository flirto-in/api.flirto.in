import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
    phoneNumber: { type: String, required: true, unique: true }, 
    U_Id: { type: String, unique: true, index: true },
    description: { type: String, default: "" },

    // E2E Encryption keys
    publicKey: { type: String }, // User's public key
    deviceKeys: [{
        deviceId: { type: String },
        publicKey: { type: String },
        addedAt: { type: Date, default: Date.now }
    }],

    // Chat relationships
    secondaryChat: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        requestedAt: { type: Date, default: Date.now }
    }],
    primaryChat: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Blocked users
    blockedUsers: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        blockedAt: { type: Date, default: Date.now }
    }],

    // Online status
    online: { type: Boolean, default: false },
    lastSeen: { type: Date },

    // Push notification token
    fcmToken: { type: String }, // Firebase Cloud Messaging token

    // Settings
    settings: {
        readReceipts: { type: Boolean, default: true },
        typingIndicators: { type: Boolean, default: true },
        lastSeenVisible: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Index for faster queries
UserSchema.index({ phoneNumber: 1 });
UserSchema.index({ U_Id: 1 });
UserSchema.index({ online: 1 });

export const User = mongoose.model('User', UserSchema);
