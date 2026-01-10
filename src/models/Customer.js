import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  plan: { type: String, enum: ["basic", "premium", "enterprise"], default: "basic" },
  metadata: Object,
});

export const Customer = mongoose.model("Customer", CustomerSchema);
