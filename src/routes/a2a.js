import { Router } from "express";
import { requireAuth } from "../middleware/index.js";
import { handleSendMessage, getTask, listTasks, cancelTask } from "../services/a2a/a2a.service.js";

const router = Router();

const JSONRPC_VERSION = "2.0";

const sendResult = (res, id, result) => {
  res.json({ jsonrpc: JSONRPC_VERSION, id, result });
};

const sendError = (res, id, code, message, data) => {
  res.json({
    jsonrpc: JSONRPC_VERSION,
    id: id ?? null,
    error: {
      code,
      message,
      ...(data ? { data } : {}),
    },
  });
};

router.post("/", requireAuth, async (req, res) => {
  const { jsonrpc, method, id, params = {} } = req.body || {};

  if (jsonrpc !== JSONRPC_VERSION || !method) {
    return sendError(res, id, -32600, "Invalid Request");
  }

  if (req.user?.role === "user") {
    return sendError(res, id, -32005, "Access denied");
  }

  try {
    switch (method) {
      case "message/send": {
        const result = await handleSendMessage(params, req.user, req);
        return sendResult(res, id, result);
      }
      case "tasks/get": {
        const taskId = params.id || params.taskId;
        if (!taskId) {
          return sendError(res, id, -32602, "Task id is required");
        }
        const task = await getTask(taskId, params.historyLength, req.user);
        if (!task) {
          return sendError(res, id, -32001, "Task not found");
        }
        return sendResult(res, id, task);
      }
      case "tasks/list": {
        const result = await listTasks(params, req.user);
        return sendResult(res, id, result);
      }
      case "tasks/cancel": {
        const taskId = params.id || params.taskId;
        if (!taskId) {
          return sendError(res, id, -32602, "Task id is required");
        }
        const result = await cancelTask(taskId, req.user);
        if (!result) {
          return sendError(res, id, -32001, "Task not found");
        }
        if (!result.cancelable) {
          return sendError(res, id, -32002, "Task cannot be canceled");
        }
        return sendResult(res, id, buildTaskResponse(result.task));
      }
      case "message/stream":
      case "tasks/subscribe":
        return sendError(res, id, -32004, "Streaming not supported");
      default:
        return sendError(res, id, -32601, "Method not found");
    }
  } catch (err) {
    const message = err?.message || "Internal error";
    return sendError(res, id, -32005, message);
  }
});

const buildTaskResponse = (task) => ({
  id: task.taskId,
  contextId: task.contextId,
  status: task.status,
  history: task.history,
  artifacts: task.artifacts,
  metadata: {
    ...(task.metadata || {}),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  },
});

export default router;
