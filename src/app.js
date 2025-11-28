import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// CORS configuration
app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import tempRoutes from "./routes/temp.routes.js";
import prekeyRoutes from "./routes/prekey.routes.js";

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/temp", tempRoutes);
app.use("/api/v1/keys", prekeyRoutes);

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
	if (err instanceof ApiError) {
		return res.status(err.statusCode).json({
			statusCode: err.statusCode,
			success: false,
			message: err.message,
			errors: err.errors ?? [],
			data: null,
		});
	}

	console.error("Unhandled Error:", err);
	return res.status(500).json({
		statusCode: 500,
		success: false,
		message: "Internal Server Error",
		data: null,
	});
});

export { app };
