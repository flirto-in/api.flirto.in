import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/User.models.js';
import Message from '../models/Message.models.js';
import { getIO, onlineUsers } from '../socket.js';

// Send a message (handles first message = chat request logic)
export const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, text, encryptedText, iv, encryptedSessionKey, messageType, mediaUrl } = req.body;
    const senderId = req.user._id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) throw new ApiError(404, 'Receiver not found');

    // Check if users have blocked each other
    const sender = await User.findById(senderId);

    const senderBlocked = receiver.blockedUsers.some(
        blocked => blocked.userId.toString() === senderId.toString()
    );

    const receiverBlocked = sender.blockedUsers.some(
        blocked => blocked.userId.toString() === receiverId
    );

    if (senderBlocked || receiverBlocked) {
        throw new ApiError(403, 'Cannot send message to blocked user');
    }

    // Check if receiver is in sender's primaryChat
    const isInPrimaryChat = sender.primaryChat.some(
        id => id.toString() === receiverId
    );

    // If first message, add receiver to sender's primaryChat
    if (!isInPrimaryChat) {
        sender.primaryChat.push(receiverId);
        await sender.save();
    }

    // Check if sender is in receiver's primaryChat
    const senderInReceiverPrimary = receiver.primaryChat.some(
        id => id.toString() === senderId.toString()
    );

    // If not in receiver's primary, add to secondary (message request)
    if (!senderInReceiverPrimary) {
        const existsInSecondary = receiver.secondaryChat.some(
            chat => chat.user.toString() === senderId.toString()
        );

        if (!existsInSecondary) {
            receiver.secondaryChat.push({
                user: senderId,
                requestedAt: new Date()
            });
            await receiver.save();

            // Notify receiver about new chat request
            const io = getIO();
            const receiverSocketId = onlineUsers.get(receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('chat:request', {
                    from: senderId,
                    sender: {
                        _id: sender._id,
                        U_Id: sender.U_Id,
                        description: sender.description
                    },
                    requestedAt: new Date()
                });
            }
        }
    }

    // Create the message
    const message = await Message.create({
        senderId,
        receiverId,
        text,
        encryptedText,
        iv,
        encryptedSessionKey,
        messageType: messageType || 'text',
        mediaUrl,
        deliveryStatus: 'sent'
    });

    // Send via Socket.IO
    const io = getIO();
    const receiverSocketId = onlineUsers.get(receiverId.toString());
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:new', message);

        // Mark as delivered if receiver is online
        message.deliveryStatus = 'delivered';
        await message.save();
    }

    return res.status(201).json(new ApiResponse(201, { message }, 'Message sent'));
});

// Search users by U_Id
export const searchUserByUid = asyncHandler(async (req, res) => {
    const { uid } = req.query;
    if (!uid) throw new ApiError(400, "U_Id is required");

    const user = await User.findOne({ U_Id: uid }).select('_id U_Id description online lastSeen');
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, { user }, "User found"));
});

// Get all chats for a user (primary + secondary)
export const getChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
        .populate('primaryChat', 'U_Id description online lastSeen')
        .populate({
            path: 'secondaryChat.user',
            select: 'U_Id description online lastSeen'
        });

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, {
        primaryChat: user.primaryChat,
        secondaryChat: user.secondaryChat
    }, "Chats retrieved successfully"));
});

// Get messages between two users
export const getMessages = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate userId
    const otherUser = await User.findById(userId);
    if (!otherUser) throw new ApiError(404, "User not found");

    // Check if users have blocked each other
    const currentUser = await User.findById(currentUserId);

    const isBlocked = currentUser.blockedUsers.some(
        blocked => blocked.userId.toString() === userId
    ) || otherUser.blockedUsers.some(
        blocked => blocked.userId.toString() === currentUserId.toString()
    );

    if (isBlocked) {
        throw new ApiError(403, 'Cannot view messages with blocked user');
    }

    // Find all messages between users, excluding deleted messages
    const messages = await Message.find({
        $or: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
        ],
        deleted: false,
        deletedBy: { $ne: currentUserId }
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
        {
            senderId: userId,
            receiverId: currentUserId,
            read: false
        },
        {
            read: true,
            readAt: new Date()
        }
    );

    // Notify sender via socket that messages were read
    const io = getIO();
    const senderSocketId = onlineUsers.get(userId);
    if (senderSocketId) {
        io.to(senderSocketId).emit('messages:read', {
            readBy: currentUserId,
            readAt: new Date()
        });
    }

    return res.status(200).json(new ApiResponse(200, { messages }, "Messages retrieved successfully"));
});

// Delete message for yourself
export const deleteMessageForMe = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new ApiError(404, 'Message not found');
    }

    // Check if user is sender or receiver
    if (message.senderId.toString() !== userId.toString() &&
        message.receiverId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized');
    }

    // Add user to deletedBy array
    if (!message.deletedBy.includes(userId)) {
        message.deletedBy.push(userId);
    }

    // If both users deleted, mark as deleted
    if (message.deletedBy.length === 2) {
        message.deleted = true;
        message.deletedAt = new Date();
    }

    await message.save();

    res.status(200).json(new ApiResponse(200, { messageId }, 'Message deleted for you'));
});

// Delete message for everyone (sender only, within time limit)
export const deleteMessageForEveryone = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new ApiError(404, 'Message not found');
    }

    // Only sender can delete for everyone
    if (message.senderId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Only sender can delete for everyone');
    }

    // Check if message is within deletion time limit (e.g., 1 hour)
    const messageAge = Date.now() - message.createdAt.getTime();
    const ONE_HOUR = 60 * 60 * 1000;

    if (messageAge > ONE_HOUR) {
        throw new ApiError(400, 'Cannot delete messages older than 1 hour');
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.text = 'This message was deleted';
    message.encryptedText = null;

    await message.save();

    // Notify receiver via socket
    const io = getIO();
    const receiverSocketId = onlineUsers.get(message.receiverId.toString());

    if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:deleted', {
            messageId,
            deletedAt: message.deletedAt
        });
    }

    res.status(200).json(new ApiResponse(200, { message }, 'Message deleted for everyone'));
});
