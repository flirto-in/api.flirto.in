import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
	{
		phoneNumber: { type: String, required: true, unique: true },
		U_Id: { type: String, unique: true },
		// Privacy: No real names or phone numbers displayed
		avatarId: { type: Number, default: 1, min: 1, max: 10 }, // 1-10 predefined icons
		about: { type: String, default: "Hey there! I am using WhispChat." }, // Status message

		// Single device login tracking
		currentDeviceId: { type: String }, // Current device ID for single device login

		// E2E Encryption keys
		publicKey: { type: String }, // User's public key
		deviceKeys: [
			{
				deviceId: { type: String },
				publicKey: { type: String },
				addedAt: { type: Date, default: Date.now },
			},
		],

		// Chat relationships
		secondaryChat: [
			{
				user: { type: Schema.Types.ObjectId, ref: "User" },
				requestedAt: { type: Date, default: Date.now },
			},
		],
		primaryChat: [{ type: Schema.Types.ObjectId, ref: "User" }],

		// Muted chats
		mutedChats: [{ type: Schema.Types.ObjectId, ref: "User" }],

		// Blocked users
		blockedUsers: [
			{
				userId: { type: Schema.Types.ObjectId, ref: "User" },
				blockedAt: { type: Date, default: Date.now },
			},
		],

		// Online status
		online: { type: Boolean, default: false },
		lastSeen: { type: Date },

		// Push notification token
		fcmToken: { type: String }, // Firebase Cloud Messaging token

		// Settings
		settings: {
			readReceipts: { type: Boolean, default: true },
			typingIndicators: { type: Boolean, default: true },
			lastSeenVisible: { type: Boolean, default: true },
		},
	},
	{
		timestamps: true,
	}
);

// No need for explicit indexes since unique: true already creates them
UserSchema.index({ online: 1 });

export const User = mongoose.model("User", UserSchema);
