import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		alias: { type: String, required: true }, // Ephemeral display name
		joinedAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const tempSessionSchema = new mongoose.Schema(
	{
		code: { type: String, unique: true, index: true }, // Join code / QR token
		participants: [participantSchema],
		active: { type: Boolean, default: true },
		endedAt: { type: Date },
		destroyed: { type: Boolean, default: false }, // flag after messages purged
		// ✅ AUTO-EXPIRATION: Session expires 24 hours after creation
		expiresAt: {
			type: Date,
			default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
			index: true,
		},
	},
	{ timestamps: true }
);

// ✅ TTL Index: MongoDB automatically deletes documents when expiresAt is reached
tempSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TempSession = mongoose.model("TempSession", tempSessionSchema);
export default TempSession;
