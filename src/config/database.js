import mongoose from "mongoose";
import { CONFIG } from "./index.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(CONFIG.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("✓ Connected to MongoDB");
  } catch (err) {
    console.error("✗ MongoDB Connection Error:", err.message);
    
    // In development, allow the app to start without MongoDB
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠ Running in development mode without MongoDB connection");
      console.warn("⚠ Some features will not work until MongoDB is available");
    } else {
      // In production, exit if MongoDB is unavailable
      process.exit(1);
    }
  }
};
