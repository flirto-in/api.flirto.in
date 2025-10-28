// ✅ ADD THIS IMPORT
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from './models/User.models.js';
import Message from './models/Message.models.js';
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
            credentials: true
        }
    });

    // Socket.io authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Add user to online users
        onlineUsers.set(socket.userId, socket.id);

        // Update user status to online
        User.findByIdAndUpdate(socket.userId, {
            online: true,
            lastSeen: new Date()
        }).exec();

        // Notify all contacts that user is online
        socket.broadcast.emit('user:online', { userId: socket.userId });

        // Join personal room
        socket.join(socket.userId);

        // ============== MESSAGE EVENTS ==============

        // Send message
        socket.on('message:send', async (data) => {
            try {
                const { receiverId, text, encryptedText, iv, encryptedSessionKey } = data;

                // Create message
                const message = await Message.create({
                    senderId: socket.userId,
                    receiverId,
                    text: text || encryptedText, // Use encryptedText if E2E enabled
                    encryptedText,
                    iv,
                    encryptedSessionKey,
                    deliveryStatus: 'sent',
                    pending: false
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate('senderId', 'U_Id phoneNumber online')
                    .populate('receiverId', 'U_Id phoneNumber online');

                // In message:send event, after creating // ✅ CORRECT - Declare first, then use
                const receiverSocketId = onlineUsers.get(receiverId);

                if (!receiverSocketId) {
                    // Receiver is offline, send push notification
                    const receiver = await User.findById(receiverId);
                    if (receiver?.fcmToken) {
                        // await sendPushNotification(
                        //     receiver.fcmToken,
                        //     `New message from ${socket.user.U_Id}`,
                        //     text?.substring(0, 50) || 'New message',
                        //     { messageId: message._id.toString(), senderId: socket.userId }
                        // );
                    }
                }

                // Send to receiver if online
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message:receive', populatedMessage);
                    message.deliveryStatus = 'delivered';
                    await message.save();
                }

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message:receive', populatedMessage);

                    // Update to delivered
                    message.deliveryStatus = 'delivered';
                    await message.save();
                }

                // Send confirmation to sender
                socket.emit('message:sent', populatedMessage);

            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Mark message as read
        socket.on('message:read', async (data) => {
            try {
                const { messageId, senderId } = data;

                await Message.findByIdAndUpdate(messageId, {
                    read: true,
                    readAt: new Date()
                });

                // Notify sender
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message:read:receipt', {
                        messageId,
                        readBy: socket.userId,
                        readAt: new Date()
                    });
                }

            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // ============== TYPING INDICATORS ==============

        socket.on('typing:start', (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing:start', {
                    userId: socket.userId,
                    timestamp: new Date()
                });
            }
        });

        socket.on('typing:stop', (data) => {
            const { receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing:stop', {
                    userId: socket.userId
                });
            }
        });

        // ============== REACTIONS ==============

        socket.on('message:react', async (data) => {
            try {
                const { messageId, emoji } = data;

                const message = await Message.findByIdAndUpdate(
                    messageId,
                    {
                        $push: {
                            reactions: {
                                userId: socket.userId,
                                emoji,
                                timestamp: new Date()
                            }
                        }
                    },
                    { new: true }
                ).populate('senderId receiverId');

                // Notify both sender and receiver
                const senderSocketId = onlineUsers.get(message.senderId._id.toString());
                const receiverSocketId = onlineUsers.get(message.receiverId._id.toString());

                const reactionData = {
                    messageId,
                    userId: socket.userId,
                    emoji,
                    timestamp: new Date()
                };

                if (senderSocketId) {
                    io.to(senderSocketId).emit('message:reaction', reactionData);
                }
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message:reaction', reactionData);
                }

            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // ============== DISCONNECT ==============

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.userId}`);

            // Remove from online users
            onlineUsers.delete(socket.userId);

            // Update user status to offline
            await User.findByIdAndUpdate(socket.userId, {
                online: false,
                lastSeen: new Date()
            });

            // Notify all contacts that user is offline
            socket.broadcast.emit('user:offline', {
                userId: socket.userId,
                lastSeen: new Date()
            });
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export { onlineUsers };
