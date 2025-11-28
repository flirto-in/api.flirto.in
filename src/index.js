import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { app } from "./app.js";
import connectDb from "./db/index.db.js";
import { initializeSocket } from "./socket.js";

const port = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with authentication
initializeSocket(server);

// Connect to database and start server
connectDb()
	.then(() => {
		server.listen(port, () => {
			console.log(`🚀 Server running at http://localhost:${port}`);
			console.log(`🔌 WebSocket server ready`);
		});
	})
	.catch((err) => {
		console.error("❌ DB connection failed:", err);
		process.exit(1);
	});
