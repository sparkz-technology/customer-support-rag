import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  otp: String,
  otpExpires: Date,
  sessionToken: String,
  lastSeen: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
