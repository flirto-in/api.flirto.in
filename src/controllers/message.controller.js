import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/User.models.js';
import Message from '../models/Message.models.js';
import { getIO, onlineUsers } from '../socket.js';
import { upload } from '../middlewares/multer.middlewares.js';
import { uplodOnCloudinary } from '../utils/cloudinary.js';

// Get messages for a specific room (public rooms)
export const getRoomMessages = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Validate room access (for now, allow public_temp)
    if (!roomId.startsWith('public_') && !roomId.startsWith('temp_room_')) {
        throw new ApiError(403, 'Access to this room is not allowed');
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
        roomId,
        $or: [
            { deleted: false },
            { deleted: { $exists: false } }
        ],
        $or: [
            { 'selfDestruct.enabled': false },
            { 'selfDestruct.enabled': { $exists: false } },
            { 'selfDestruct.expiresAt': { $gt: new Date() } }
        ]
    })
        .populate('senderId', 'U_Id phoneNumber')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    res.status(200).json(
        new ApiResponse(200, { 
            messages: messages.reverse(), // Reverse to get chronological order
            roomId,
            page: parseInt(page),
            limit: parseInt(limit)
        }, 'Room messages retrieved successfully')
    );
});

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

    // Check if receiver is already in sender's chats (primary or secondary)
    const isInSenderPrimaryChat = sender.primaryChat.some(
        id => id.toString() === receiverId
    );
    const isInSenderSecondaryChat = sender.secondaryChat.some(
        chat => chat.user.toString() === receiverId
    );

    // If first message from sender, add receiver to sender's secondaryChat
    if (!isInSenderPrimaryChat && !isInSenderSecondaryChat) {
        sender.secondaryChat.push({
            user: receiverId,
            requestedAt: new Date()
        });
        await sender.save();

        // Notify sender about new chat created
        const io = getIO();
        const senderSocketId = onlineUsers.get(senderId.toString());
        if (senderSocketId) {
            io.to(senderSocketId).emit('chat:created', {
                user: {
                    _id: receiver._id,
                    U_Id: receiver.U_Id,
                    description: receiver.description,
                    online: receiver.online,
                    lastSeen: receiver.lastSeen
                },
                isInSecondary: true
            });
        }
    }

    // Check if sender is in receiver's chats (primary or secondary)
    const isInReceiverPrimaryChat = receiver.primaryChat.some(
        id => id.toString() === senderId.toString()
    );
    const isInReceiverSecondaryChat = receiver.secondaryChat.some(
        chat => chat.user.toString() === senderId.toString()
    );

    // If not in receiver's chats, add to secondary (message request)
    if (!isInReceiverPrimaryChat && !isInReceiverSecondaryChat) {
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
                    description: sender.description,
                    online: sender.online,
                    lastSeen: sender.lastSeen
                },
                requestedAt: new Date()
            });
        }
    }

    // Create the message
    // CRITICAL: Never store plaintext when E2EE is enabled!
    const message = await Message.create({
        senderId,
        receiverId,
        // Only store text if no encrypted version (backward compatibility)
        text: encryptedText ? undefined : text,
        encryptedText: encryptedText || undefined,
        // Signal Protocol fields
        ratchetHeader: req.body.ratchetHeader || undefined,
        nonce: req.body.nonce || undefined,
        // Legacy fields (deprecated)
        iv: iv || undefined,
        encryptedSessionKey: encryptedSessionKey || undefined,
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

    // Add muted status to chats
    const mutedChatIds = (user.mutedChats || []).map(id => id.toString());

    const primaryChatWithMuteStatus = user.primaryChat.map(chat => ({
        ...chat.toObject(),
        isMuted: mutedChatIds.includes(chat._id.toString())
    }));

    const secondaryChatWithMuteStatus = user.secondaryChat.map(chat => ({
        ...chat.toObject(),
        user: {
            ...chat.user.toObject(),
            isMuted: mutedChatIds.includes(chat.user._id.toString())
        }
    }));

    return res.status(200).json(new ApiResponse(200, {
        primaryChat: primaryChatWithMuteStatus,
        secondaryChat: secondaryChatWithMuteStatus
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

// Move user to primary chat section
export const moveToPrimary = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Check if already in primary
    const alreadyInPrimary = user.primaryChat.some(
        id => id.toString() === userId
    );

    if (alreadyInPrimary) {
        return res.status(200).json(
            new ApiResponse(200, {}, 'User already in primary chat')
        );
    }

    // Remove from secondary if exists
    user.secondaryChat = user.secondaryChat.filter(
        chat => chat.user.toString() !== userId
    );

    // Add to primary
    user.primaryChat.push(userId);
    await user.save();

    res.status(200).json(
        new ApiResponse(200, {}, 'Chat moved to primary successfully')
    );
});

// Move user to secondary chat section
export const moveToSecondary = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Check if already in secondary
    const alreadyInSecondary = user.secondaryChat.some(
        chat => chat.user.toString() === userId
    );

    if (alreadyInSecondary) {
        return res.status(200).json(
            new ApiResponse(200, {}, 'User already in secondary chat')
        );
    }

    // Remove from primary
    user.primaryChat = user.primaryChat.filter(
        id => id.toString() !== userId
    );

    // Add to secondary
    user.secondaryChat.push({
        user: userId,
        requestedAt: new Date()
    });

    await user.save();

    res.status(200).json(
        new ApiResponse(200, {}, 'Chat moved to secondary successfully')
    );
});

// Delete entire chat with a user
export const deleteChat = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Remove from both primary and secondary
    user.primaryChat = user.primaryChat.filter(
        id => id.toString() !== userId
    );

    user.secondaryChat = user.secondaryChat.filter(
        chat => chat.user.toString() !== userId
    );

    // Delete all messages between users (mark as deleted for current user)
    await Message.updateMany(
        {
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ]
        },
        {
            $addToSet: { deletedBy: currentUserId }
        }
    );

    await user.save();

    res.status(200).json(
        new ApiResponse(200, {}, 'Chat deleted successfully')
    );
});

// Clear all messages in a chat
export const clearChat = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Mark all messages as deleted for current user
    await Message.updateMany(
        {
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ]
        },
        {
            $addToSet: { deletedBy: currentUserId }
        }
    );

    res.status(200).json(
        new ApiResponse(200, {}, 'Chat cleared successfully')
    );
});

// Toggle mute status for a chat
export const muteChat = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Initialize mutedChats array if doesn't exist
    if (!user.mutedChats) {
        user.mutedChats = [];
    }

    // Check if already muted
    const isMuted = user.mutedChats.some(
        id => id.toString() === userId
    );

    if (isMuted) {
        // Unmute
        user.mutedChats = user.mutedChats.filter(
            id => id.toString() !== userId
        );
    } else {
        // Mute
        user.mutedChats.push(userId);
    }

    await user.save();

    res.status(200).json(
        new ApiResponse(
            200,
            { isMuted: !isMuted },
            `Chat ${!isMuted ? 'muted' : 'unmuted'} successfully`
        )
    );
});

// Upload a file and create (or optionally hide) a message
// Accepts multipart/form-data: file, receiverId OR roomId, optional hideInTemp (boolean)
export const uploadFileMessage = asyncHandler(async (req, res) => {
    const senderId = req.user._id;
    const { receiverId, roomId, hideInTemp } = req.body;

    if (!req.file) {
        throw new ApiError(400, 'File is required');
    }

    // Determine if temp session (room based)
    const isTempRoom = roomId && roomId.startsWith('temp_room_');

    // For direct temp sessions, we would detect via receiver but current design uses room prefix.
    // Upload file to Cloudinary
    const uploaded = await uplodOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(500, 'Upload failed');

    // Decide messageType from mimetype
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) messageType = 'image';
    else if (req.file.mimetype.startsWith('video/')) messageType = 'video';
    else if (req.file.mimetype.startsWith('audio/')) messageType = 'audio';

    // If temp room and requirement is to not show in chat, set hidden
    const hidden = !!(isTempRoom && hideInTemp);

    // If temp room and we do NOT allow media (previous rule) but user wants upload system: we allow upload but hide
    // (Server earlier blocked media in socket path; here we bypass message creation visibility via hidden flag.)

    const messageData = {
        senderId,
        messageType,
        mediaUrl: uploaded.secure_url || uploaded.url,
        deliveryStatus: 'sent',
        hidden
    };

    if (roomId) {
        messageData.roomId = roomId;
    } else if (receiverId) {
        // Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) throw new ApiError(404, 'Receiver not found');
        messageData.receiverId = receiverId;
    } else {
        throw new ApiError(400, 'receiverId or roomId is required');
    }

    // Mark ephemeral if temp room
    if (isTempRoom) {
        // Attempt to link to TempSession for cleanup
        const code = roomId.replace('temp_room_', '');
        const tempSession = await (await import('../models/TempSession.models.js')).default.findOne({ code, active: true });
        if (tempSession) {
            messageData.tempSessionId = tempSession._id;
            messageData.ephemeral = true;
        }
    }

    const message = await Message.create(messageData);

    // Populate minimal fields for response
    const populated = await Message.findById(message._id)
        .populate('senderId', 'U_Id phoneNumber online')
        .populate('receiverId', 'U_Id phoneNumber online');

    // Emit via socket only if not hidden
    const io = getIO();
    if (!hidden) {
        if (roomId) {
            io.to(roomId).emit('message:receive', populated);
            message.deliveryStatus = 'delivered';
            await message.save();
        } else if (receiverId) {
            const receiverSocketId = onlineUsers.get(receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('message:receive', populated);
                message.deliveryStatus = 'delivered';
                await message.save();
            }
        }
    }

    return res.status(201).json(new ApiResponse(201, { message: populated }, 'File uploaded'));
});
