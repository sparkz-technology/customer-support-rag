import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  role: { 
    type: String, 
    enum: ["user", "agent", "admin"], 
    default: "user" 
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  otp: String,
  otpExpires: Date,
  sessionToken: String,
  lastSeen: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
