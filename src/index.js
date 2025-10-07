import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import connectDb from "./db/index.db.js";

const port = process.env.PORT || 8000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

// In-memory map of online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
        if (!userId) return;
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);
        io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("private-message", ({ senderId, receiverId, message }) => {
        const receiverSocketId = receiverId ? onlineUsers.get(receiverId) : undefined;
        const msgObj = {
            senderId,
            receiverId,
            message,
            time: new Date().toISOString(),
        };

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive-message", msgObj);
        }

        // Echo back to sender (useful for client-side UI rendering)
        socket.emit("receive-message", msgObj);

        console.log("Message:", msgObj);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit("online-users", Array.from(onlineUsers.keys()));
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

connectDb()
    .then(() => {
        server.listen(port, () => {
            console.log(`🚀 App is running at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.log("❌ DB connection failed {index.js} error:", error);
    });
