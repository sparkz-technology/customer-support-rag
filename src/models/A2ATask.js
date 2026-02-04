import mongoose from "mongoose";

const A2ATaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    contextId: { type: String },
    status: { type: mongoose.Schema.Types.Mixed, required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
    artifacts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const A2ATask = mongoose.model("A2ATask", A2ATaskSchema);
