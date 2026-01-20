import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["customer", "agent", "system"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const TicketSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerEmail: String,
    subject: String,
    description: String,
    category: {
      type: String,
      enum: ["account", "billing", "technical", "gameplay", "security", "general"],
      default: "general",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    slaDueAt: { type: Date, index: true },
    slaBreached: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    firstResponseAt: { type: Date },
    conversation: [MessageSchema],
    agentLogs: { type: [String], default: [] },
    needsManualReview: { type: Boolean, default: false },
    reopenedAt: { type: Date },
    reopenCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for efficient queries
TicketSchema.index({ status: 1, assignedTo: 1 });
TicketSchema.index({ category: 1, status: 1 });

export const Ticket = mongoose.model("Ticket", TicketSchema);
