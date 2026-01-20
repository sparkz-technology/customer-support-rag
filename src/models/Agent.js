import mongoose from "mongoose";

const AgentSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  categories: [{ 
    type: String, 
    enum: ["account", "billing", "technical", "gameplay", "security", "general"] 
  }],
  isActive: { type: Boolean, default: true },
  currentLoad: { type: Number, default: 0 }, // Number of open tickets assigned
  maxLoad: { type: Number, default: 10 },
}, { timestamps: true });

export const Agent = mongoose.model("Agent", AgentSchema);
