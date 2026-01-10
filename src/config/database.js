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
    process.exit(1);
  }
};
