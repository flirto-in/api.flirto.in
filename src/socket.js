// ✅ ADD THIS IMPORT
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./models/User.models.js";
import Message from "./models/Message.models.js";
import TempSession from "./models/TempSession.models.js";
// import { sendPushNotification } from './firebase.js';

let io;

// Store online users: { userId: socketId }
const onlineUsers = new Map();

// Store typing status: { roomId: Set of userIds }
const typingUsers = new Map();

export const initializeSocket = (server) => {
	io = new Server(server, {
		cors: {
			origin: process.env.FRONTEND_URL,
			credentials: true,
		},
	});

	// Cleanup expired self-destruct messages every 30 seconds
	setInterval(async () => {
		try {
			const expiredMessages = await Message.find({
				"selfDestruct.enabled": true,
				"selfDestruct.expiresAt": { $lt: new Date() },
				"selfDestruct.deletedAt": { $exists: false },
			});

			for (const message of expiredMessages) {
				// Mark as deleted
				message.selfDestruct.deletedAt = new Date();
				message.deleted = true;
				await message.save();

				// Emit deletion event to relevant users/rooms
				if (message.roomId) {
					io.to(message.roomId).emit("message:self-destruct", {
						messageId: message._id,
					});
				} else if (message.receiverId) {
					const senderSocketId = onlineUsers.get(message.senderId.toString());
					const receiverSocketId = onlineUsers.get(
						message.receiverId.toString()
					);

					if (senderSocketId) {
						io.to(senderSocketId).emit("message:self-destruct", {
							messageId: message._id,
						});
					}
					if (receiverSocketId) {
						io.to(receiverSocketId).emit("message:self-destruct", {
							messageId: message._id,
						});
					}
				}
			}

			if (expiredMessages.length > 0) {
				console.log(`🗑️ Cleaned up ${expiredMessages.length} expired messages`);
			}
		} catch (error) {
			console.error("❌ Error cleaning up expired messages:", error);
		}
	}, 30000); // Every 30 seconds

	// Socket.io authentication middleware
	io.use(async (socket, next) => {
		try {
			const token = socket.handshake.auth.token;

			if (!token) {
				return next(new Error("Authentication error"));
			}

			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(decoded.id);

			if (!user) {
				return next(new Error("User not found"));
			}

			socket.userId = user._id.toString();
			socket.user = user;
			next();
		} catch (error) {
			next(new Error("Authentication error"));
		}
	});

	io.on("connection", (socket) => {
		console.log(`User connected: ${socket.userId}`);

		// Check if user is already connected from another device (single device login)
		const existingSocketId = onlineUsers.get(socket.userId);
		if (existingSocketId && existingSocketId !== socket.id) {
			// Emit logout event to the old device
			io.to(existingSocketId).emit("force:logout", {
				reason: "Logged in from another device",
				message:
					"You have been logged out because you logged in on another device",
			});
			console.log(
				`🔄 User ${socket.userId} logged in from new device. Logging out old device.`
			);

			// Disconnect the old socket
			const oldSocket = io.sockets.sockets.get(existingSocketId);
			if (oldSocket) {
				oldSocket.disconnect(true);
			}
		}

		// Add user to online users
		onlineUsers.set(socket.userId, socket.id);

		// Update user status to online
		User.findByIdAndUpdate(socket.userId, {
			online: true,
			lastSeen: new Date(),
		}).exec();

		// Notify all contacts that user is online
		socket.broadcast.emit("user:online", { userId: socket.userId });

		// Join personal room
		socket.join(socket.userId);

		// ============== PUBLIC ROOM EVENTS ==============

		// Join public room for temp sessions
		socket.on("room:join", (data) => {
			const { roomId } = data;
			if (roomId === "public_temp" || roomId.startsWith("temp_room_")) {
				socket.join(roomId);
				socket.currentRoom = roomId;
				console.log(`User ${socket.userId} joined room: ${roomId}`);

				// Notify others in room
				socket.to(roomId).emit("user:joined:room", {
					userId: socket.userId,
					userName: socket.user.U_Id,
					roomId,
				});

				socket.emit("room:joined", { roomId, success: true });
			} else {
				socket.emit("room:joined", {
					roomId,
					success: false,
					error: "Invalid room",
				});
			}
		});

		// Leave room
		socket.on("room:leave", (data) => {
			const { roomId } = data;
			socket.leave(roomId);
			if (socket.currentRoom === roomId) {
				socket.currentRoom = null;
			}

			// Notify others in room
			socket.to(roomId).emit("user:left:room", {
				userId: socket.userId,
				userName: socket.user.U_Id,
				roomId,
			});

			console.log(`User ${socket.userId} left room: ${roomId}`);
		});

		// ============== MESSAGE EVENTS ==============

		// Send message (supports temp sessions)
		socket.on("message:send", async (data) => {
			try {
				const {
					receiverId,
					roomId,
					text,
					encryptedText,
					iv,
					encryptedSessionKey,
					selfDestruct,
					tempSessionId,
					messageType,
					mediaUrl,
				} = data;

				// Skip chat initialization for room messages
				if (!roomId && receiverId) {
					// Handle chat initialization for direct messages
					console.log(
						`🔍 Checking chat initialization: sender=${socket.userId}, receiver=${receiverId}`
					);

					const sender = await User.findById(socket.userId);
					const receiver = await User.findById(receiverId);

					if (sender && receiver) {
						// Check if receiver is already in sender's chats (primary or secondary)
						const isInSenderPrimaryChat = sender.primaryChat.some(
							(id) => id.toString() === receiverId
						);
						const isInSenderSecondaryChat = sender.secondaryChat.some(
							(chat) => chat.user.toString() === receiverId
						);

						console.log(
							`📊 Sender chat status: primary=${isInSenderPrimaryChat}, secondary=${isInSenderSecondaryChat}`
						);

						// If first message from sender, add receiver to sender's secondaryChat
						if (!isInSenderPrimaryChat && !isInSenderSecondaryChat) {
							sender.secondaryChat.push({
								user: receiverId,
								requestedAt: new Date(),
							});
							await sender.save();
							console.log(`✅ Added receiver to sender's secondaryChat`);

							// Notify sender about new chat created
							socket.emit("chat:created", {
								user: {
									_id: receiver._id,
									U_Id: receiver.U_Id,
									description: receiver.description,
									online: receiver.online,
									lastSeen: receiver.lastSeen,
								},
								isInSecondary: true,
							});
							console.log(`📤 Sent chat:created event to sender`);
						}

						// Check if sender is in receiver's chats (primary or secondary)
						const isInReceiverPrimaryChat = receiver.primaryChat.some(
							(id) => id.toString() === socket.userId
						);
						const isInReceiverSecondaryChat = receiver.secondaryChat.some(
							(chat) => chat.user.toString() === socket.userId
						);

						console.log(
							`📊 Receiver chat status: primary=${isInReceiverPrimaryChat}, secondary=${isInReceiverSecondaryChat}`
						);

						// If not in receiver's chats, add to secondary (message request)
						if (!isInReceiverPrimaryChat && !isInReceiverSecondaryChat) {
							receiver.secondaryChat.push({
								user: socket.userId,
								requestedAt: new Date(),
							});
							await receiver.save();
							console.log(`✅ Added sender to receiver's secondaryChat`);

							// Notify receiver about new chat request
							const receiverSocketId = onlineUsers.get(receiverId);
							if (receiverSocketId) {
								io.to(receiverSocketId).emit("chat:request", {
									from: socket.userId,
									sender: {
										_id: sender._id,
										U_Id: sender.U_Id,
										description: sender.description,
										online: sender.online,
										lastSeen: sender.lastSeen,
									},
									requestedAt: new Date(),
								});
								console.log(`📤 Sent chat:request event to receiver`);
							} else {
								console.log(`⚠️  Receiver not online, event not sent`);
							}
						}
					}
				}

				// Prepare message data
				// CRITICAL: Never store plaintext when E2EE is enabled!
				const messageData = {
					senderId: socket.userId,
					// Only store text if no encrypted version (backward compatibility)
					text: encryptedText ? undefined : text,
					encryptedText: encryptedText || undefined,
					// Store Signal Protocol ratchet header and nonce
					ratchetHeader: data.ratchetHeader || undefined,
					nonce: data.nonce || undefined,
					// Legacy encryption fields (deprecated)
					iv: iv || undefined,
					encryptedSessionKey: encryptedSessionKey || undefined,
					deliveryStatus: "sent",
					pending: false,
				};

				// Ephemeral temp session handling: via explicit tempSessionId or roomId prefix
				let isEphemeral = false;
				if (tempSessionId) {
					const session = await TempSession.findById(tempSessionId);
					if (!session || !session.active) {
						return socket.emit("error", { message: "Temp session inactive" });
					}
					messageData.tempSessionId = tempSessionId;
					messageData.ephemeral = true;
					isEphemeral = true;
				} else if (roomId && roomId.startsWith("temp_room_")) {
					const code = roomId.replace("temp_room_", "");
					const session = await TempSession.findOne({ code, active: true });
					if (session) {
						messageData.tempSessionId = session._id;
						messageData.ephemeral = true;
						isEphemeral = true;
					}
				}

				// Disallow media/attachments in ephemeral temp sessions
				if (
					isEphemeral &&
					(mediaUrl || (messageType && messageType !== "text"))
				) {
					return socket.emit("error", {
						message: "Media/attachments are not allowed in temp sessions",
					});
				}

				// Handle room vs direct message
				if (roomId) {
					messageData.roomId = roomId;
					// For room messages, receiverId is optional
					if (receiverId) {
						messageData.receiverId = receiverId;
					}
				} else {
					messageData.receiverId = receiverId;
				}

				// Handle self-destruct
				if (selfDestruct && selfDestruct.enabled && selfDestruct.ttlSeconds) {
					messageData.selfDestruct = {
						enabled: true,
						ttlSeconds: selfDestruct.ttlSeconds,
						expiresAt: new Date(Date.now() + selfDestruct.ttlSeconds * 1000),
					};
				}

				// Create message
				const message = await Message.create(messageData);

				const populatedMessage = await Message.findById(message._id)
					.populate("senderId", "U_Id phoneNumber online")
					.populate("receiverId", "U_Id phoneNumber online");

				// Get receiver socket ID
				const receiverSocketId = onlineUsers.get(receiverId);

				if (!receiverSocketId) {
					// Receiver is offline, send push notification
					const receiver = await User.findById(receiverId);
					if (receiver?.fcmToken) {
						// SECURITY: Never include message content in push notifications for E2EE!
						// Only send wake notification
						const notificationBody = encryptedText
							? "New encrypted message" // E2EE - no content preview
							: text?.substring(0, 50) || "New message"; // Plaintext legacy

						// await sendPushNotification(
						//     receiver.fcmToken,
						//     `New message from ${socket.user.U_Id}`,
						//     notificationBody,
						//     { messageId: message._id.toString(), senderId: socket.userId, encrypted: !!encryptedText }
						// );
					}
				}

				// Handle delivery based on room vs direct message
				if (roomId) {
					// Broadcast to all users in the room except sender
					socket.to(roomId).emit("message:receive", populatedMessage);
					message.deliveryStatus = "delivered";
					await message.save();
				} else {
					// Direct message - send to specific receiver
					if (receiverSocketId) {
						io.to(receiverSocketId).emit("message:receive", populatedMessage);
						message.deliveryStatus = "delivered";
						await message.save();
					}
				}

				// Send confirmation to sender
				socket.emit("message:sent", populatedMessage);
			} catch (error) {
				socket.emit("error", { message: error.message });
			}
		});

		// Mark message as read
		socket.on("message:read", async (data) => {
			try {
				const { messageId, senderId } = data;

				await Message.findByIdAndUpdate(messageId, {
					read: true,
					readAt: new Date(),
				});

				// Notify sender
				const senderSocketId = onlineUsers.get(senderId);
				if (senderSocketId) {
					io.to(senderSocketId).emit("message:read:receipt", {
						messageId,
						readBy: socket.userId,
						readAt: new Date(),
					});
				}
			} catch (error) {
				socket.emit("error", { message: error.message });
			}
		});

		// ============== TYPING INDICATORS ==============

		socket.on("typing:start", (data) => {
			const { receiverId } = data;
			const receiverSocketId = onlineUsers.get(receiverId);

			if (receiverSocketId) {
				io.to(receiverSocketId).emit("typing:start", {
					userId: socket.userId,
					timestamp: new Date(),
				});
			}
		});

		socket.on("typing:stop", (data) => {
			const { receiverId } = data;
			const receiverSocketId = onlineUsers.get(receiverId);

			if (receiverSocketId) {
				io.to(receiverSocketId).emit("typing:stop", {
					userId: socket.userId,
				});
			}
		});

		// ============== REACTIONS ==============

		socket.on("message:react", async (data) => {
			try {
				const { messageId, emoji } = data;

				const message = await Message.findByIdAndUpdate(
					messageId,
					{
						$push: {
							reactions: {
								userId: socket.userId,
								emoji,
								timestamp: new Date(),
							},
						},
					},
					{ new: true }
				).populate("senderId receiverId");

				// Notify both sender and receiver
				const senderSocketId = onlineUsers.get(message.senderId._id.toString());
				const receiverSocketId = onlineUsers.get(
					message.receiverId._id.toString()
				);

				const reactionData = {
					messageId,
					userId: socket.userId,
					emoji,
					timestamp: new Date(),
				};

				if (senderSocketId) {
					io.to(senderSocketId).emit("message:reaction", reactionData);
				}
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("message:reaction", reactionData);
				}
			} catch (error) {
				socket.emit("error", { message: error.message });
			}
		});

		// ============== DISCONNECT ==============

		socket.on("disconnect", async () => {
			console.log(`User disconnected: ${socket.userId}`);

			// Remove from online users
			onlineUsers.delete(socket.userId);

			// Update user status to offline
			await User.findByIdAndUpdate(socket.userId, {
				online: false,
				lastSeen: new Date(),
			});

			// Notify all contacts that user is offline
			socket.broadcast.emit("user:offline", {
				userId: socket.userId,
				lastSeen: new Date(),
			});
		});
	});

	return io;
};

export const getIO = () => {
	if (!io) {
		throw new Error("Socket.io not initialized");
	}
	return io;
};

export { onlineUsers };
