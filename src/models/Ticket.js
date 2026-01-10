import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerEmail: String,
    subject: String,
    description: String,
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    slaDueAt: { type: Date, index: true },
    slaBreached: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    agentLogs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", TicketSchema);
