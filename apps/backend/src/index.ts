import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST, before anything else
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import walletRoutes from './routes/walletRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { walletService } from './services/walletService.js';

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || "";

// CORS Configuration - Allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter((origin): origin is string => typeof origin === 'string' && origin.length > 0);

// Middleware
app.use(cors({ 
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use("/api/wallet", walletRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/otp", otpRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handler (must be last)
app.use(errorHandler);

// Database connection
async function startServer() {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();