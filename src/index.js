import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import connectDb from "./db/index.db.js";
import Message  from "./models/Message.models.js";

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

        const message = await Message.create({ senderId, receiverId, text });

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
