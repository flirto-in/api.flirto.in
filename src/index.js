import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import connectDb from "./db/index.db.js";
import Message from "./models/Message.models.js";

const port = process.env.PORT || 8000;
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*", credentials: true } });

// Online users map
const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
        if (!userId) return;
        onlineUsers.set(userId, socket.id);
        io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("typing", ({ from, to, typing }) => {
        const receiverSocketId = onlineUsers.get(to);
        if (receiverSocketId) io.to(receiverSocketId).emit("typing", { from, typing });
    });

    socket.on("private-message", async ({ senderId, receiverId, text }) => {
        if (!senderId || !receiverId || !text) return;

        // Find sender and receiver
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) return;

        // Check if receiver already has sender in primaryChat
        const isPrimary = receiver.primaryChat.includes(senderId);

        if (!isPrimary) {
            // Add to secondaryChat if not already there
            if (!receiver.secondaryChat.includes(senderId)) {
                receiver.secondaryChat.push(senderId);
                await receiver.save();
            }
        }

        // Save message
        const message = await Message.create({ senderId, receiverId, text, pending: !isPrimary });

        // Emit to receiver
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) io.to(receiverSocketId).emit("receive-message", message);

        // Echo to sender
        socket.emit("receive-message", message);
    });


    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit("online-users", Array.from(onlineUsers.keys()));
                break;
            }
        }
    });
});

connectDb()
    .then(() => {
        server.listen(port, () => console.log(`🚀 App running at http://localhost:${port}`));
    })
    .catch((err) => console.error("❌ DB connection failed:", err));
