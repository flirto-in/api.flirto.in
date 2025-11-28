import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import TempSession from "../models/TempSession.models.js";
import Message from "../models/Message.models.js";
import { User } from "../models/User.models.js";
import { getIO } from "../socket.js";

// Helper to generate random session code
const generateCode = (len = 8) => {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	for (let i = 0; i < len; i++)
		out += chars[Math.floor(Math.random() * chars.length)];
	return out;
};

// Create temp session
export const createTempSession = asyncHandler(async (req, res) => {
	const userId = req.user?._id || req.user?.id || req.auth?.id; // adapt to existing auth middleware
	if (!userId) throw new ApiError(401, "Unauthorized");

	const user = await User.findById(userId);
	if (!user) throw new ApiError(404, "User not found");

	const code = generateCode();
	const alias = `Anon-${code.slice(0, 4)}`;

	const session = await TempSession.create({
		code,
		participants: [{ userId, alias }],
	});

	return res
		.status(201)
		.json(
			new ApiResponse(
				201,
				{ sessionId: session._id, code, alias },
				"Temp session created"
			)
		);
});

// Join temp session by code
export const joinTempSession = asyncHandler(async (req, res) => {
	const { code } = req.body;
	const userId = req.user?._id || req.user?.id || req.auth?.id;
	if (!userId) throw new ApiError(401, "Unauthorized");
	if (!code) throw new ApiError(400, "Code required");

	const session = await TempSession.findOne({ code, active: true });
	if (!session) throw new ApiError(404, "Active session not found");

	const already = session.participants.some(
		(p) => p.userId.toString() === userId.toString()
	);
	if (!already) {
		const alias = `Anon-${generateCode(4)}`;
		session.participants.push({ userId, alias });
		await session.save();
	}

	const participant = session.participants.find(
		(p) => p.userId.toString() === userId.toString()
	);

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				sessionId: session._id,
				code: session.code,
				alias: participant.alias,
				participants: session.participants.map((p) => ({ alias: p.alias })),
			},
			"Joined temp session"
		)
	);
});

// Get messages for temp session (ephemeral)
export const getTempSessionMessages = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const session = await TempSession.findById(id);
	if (!session || !session.active)
		throw new ApiError(404, "Session not active");
	const messages = await Message.find({ tempSessionId: id }).sort({
		createdAt: 1,
	});
	return res
		.status(200)
		.json(new ApiResponse(200, { messages }, "Temp messages loaded"));
});

// End temp session manually
export const endTempSession = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const session = await TempSession.findById(id);
	if (!session) throw new ApiError(404, "Session not found");
	if (!session.active) throw new ApiError(400, "Session already ended");

	// Mark inactive
	session.active = false;
	session.endedAt = new Date();
	await session.save();

	// Destroy messages (hard delete)
	await Message.deleteMany({ tempSessionId: id });
	session.destroyed = true;
	await session.save();

	// Broadcast session end to room and participants
	try {
		const io = getIO();
		const roomId = `temp_room_${session.code}`;
		io.to(roomId).emit("temp:session:ended", { sessionId: id });
		// Also emit to each participant's personal room (userId) for safety
		session.participants.forEach((p) => {
			io.to(p.userId.toString()).emit("temp:session:ended", { sessionId: id });
		});
	} catch (e) {
		console.error("Failed to broadcast temp session end:", e.message);
	}

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ sessionId: id },
				"Temp session ended and messages destroyed"
			)
		);
});
