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
	},
	{ timestamps: true }
);

export const TempSession = mongoose.model("TempSession", tempSessionSchema);
export default TempSession;
