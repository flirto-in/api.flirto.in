import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { ApiError } from './utils/ApiError.js';

const app = express();

// Environment variables loaded in index.js

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Import routes
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import roomRoutes from './routes/room.routes.js';
import premiumRoutes from './routes/premium.routes.js';
import dailyAskRoutes from './routes/dailyAsk.routes.js';

// Routes
app.use('/api/v1/users', authRoutes);
app.use('/api/v1/users', userRoutes); 
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/premium', premiumRoutes);
app.use('/api/v1/daily-ask', dailyAskRoutes);

// http://localhost:3000/api/v1/

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

  console.error('Unhandled Error:', err);
  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: 'Internal Server Error',
    data: null,
  });
});

export { app };
