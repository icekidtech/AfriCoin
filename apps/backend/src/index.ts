import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import walletRoutes from "./routes/walletRoutes";
import transferRoutes from "./routes/transferRoutes";
import otpRoutes from "./routes/otpRoutes"; // OTP Routes
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || "";

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "" }));
app.use(express.json());

// Routes
app.use("/api/wallet", walletRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/otp", otpRoutes); // OTP Routes

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