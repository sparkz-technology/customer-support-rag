import crypto from "crypto";
import { A2ATask, Ticket } from "../../models/index.js";
import { CONFIG } from "../../config/index.js";
import { runAgent } from "../agent.js";
import { detectCategory } from "../ticket/ticket-assignment.js";
import { updateTicket as updateTicketByAgent } from "../agent/agent-panel.service.js";
import { sanitizeString } from "../validator.js";

const TASK_STATES = {
  SUBMITTED: "submitted",
  WORKING: "working",
  INPUT_REQUIRED: "input-required",
  COMPLETED: "completed",
  CANCELED: "canceled",
  FAILED: "failed",
};

const makeTextPart = (text) => ({ type: "text", text });
const makeDataPart = (data) => ({ type: "data", data });
const makeMessage = (role, parts) => ({ role, parts });

const makeStatus = (state, messageText) => {
  if (!messageText) return { state };
  return { state, message: makeMessage("agent", [makeTextPart(messageText)]) };
};

const extractTicketId = (text) => {
  if (!text) return null;
  const match = text.match(/[a-f0-9]{24}/i);
  return match ? match[0] : null;
};

const inferPriority = (text) => {
  if (!text) return null;
  const urgentSignals = /(urgent|immediately|asap|critical|outage)/i;
  const highSignals = /(payment failed|billing issue|security|breach)/i;
  if (urgentSignals.test(text)) return "urgent";
  if (highSignals.test(text)) return "high";
  return null;
};

const buildTaskResponse = (taskDoc, historyLength) => {
  const history = historyLength
    ? taskDoc.history.slice(-historyLength)
    : taskDoc.history;
  return {
    id: taskDoc.taskId,
    contextId: taskDoc.contextId,
    status: taskDoc.status,
    history,
    artifacts: taskDoc.artifacts,
    metadata: {
      ...(taskDoc.metadata || {}),
      createdAt: taskDoc.createdAt,
      updatedAt: taskDoc.updatedAt,
    },
  };
};

const upsertTask = async (taskDoc, { status, history, artifacts, metadata }) => {
  taskDoc.status = status || taskDoc.status;
  taskDoc.history = history || taskDoc.history;
  taskDoc.artifacts = artifacts || taskDoc.artifacts;
  taskDoc.metadata = metadata || taskDoc.metadata;
  await taskDoc.save();
  return taskDoc;
};

export const getAgentCard = (req) => {
  const baseUrl =
    CONFIG.A2A_PUBLIC_URL ||
    `${req.protocol}://${req.get("host")}`;

  return {
    name: CONFIG.A2A_AGENT_NAME || "Support Ticket Fixer",
    description: "Agent that analyzes support tickets and suggests or applies fixes.",
    provider: {
      organization: CONFIG.A2A_ORG_NAME || "Support Platform",
    },
    url: `${baseUrl}/api/a2a`,
    version: CONFIG.A2A_AGENT_VERSION || "1.0.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    securityRequirements: [{ bearerAuth: [] }],
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    supportedInterfaces: [
      {
        url: `${baseUrl}/api/a2a`,
        protocolBinding: "JSONRPC",
        protocolVersion: "1.0",
      },
    ],
    skills: [
      {
        id: "ticket-fix",
        name: "Ticket Fix Orchestrator",
        description:
          "Analyzes a ticket, suggests updates, and can optionally apply changes with a remark.",
        tags: ["support", "ticket", "triage"],
        inputModes: ["text/plain", "application/json"],
        outputModes: ["text/plain", "application/json"],
        examples: [
          {
            description: "Analyze a ticket and suggest fixes",
            input: {
              parts: [
                { type: "data", data: { ticketId: "64f1a2b3c4d5e6f7890abcde" } },
              ],
            },
          },
          {
            description: "Apply status update with a remark",
            input: {
              parts: [
                {
                  type: "data",
                  data: {
                    ticketId: "64f1a2b3c4d5e6f7890abcde",
                    applyChanges: true,
                    updates: { status: "in-progress" },
                    remark: "Customer confirmed issue still happening",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
};

export const handleSendMessage = async ({ message, metadata = {} }, user, req) => {
  if (!message || !message.role || !Array.isArray(message.parts)) {
    throw new Error("Invalid message format");
  }

  const textParts = message.parts.filter((p) => p.type === "text").map((p) => p.text);
  const dataParts = message.parts.filter((p) => p.type === "data").map((p) => p.data);
  const text = textParts.join("\n").trim();
  const data = dataParts.find((d) => d && typeof d === "object") || {};

  const ticketId = data.ticketId || extractTicketId(text);
  if (!ticketId) {
    const failedTask = await A2ATask.create({
      taskId: crypto.randomUUID(),
      status: makeStatus(TASK_STATES.FAILED, "ticketId is required"),
      history: [message],
      artifacts: [],
      metadata: { createdBy: user?.email, reason: "missing_ticket_id" },
    });
    return buildTaskResponse(failedTask);
  }

  const ticket = await Ticket.findById(ticketId).populate("assignedTo", "name email");
  if (!ticket) {
    const failedTask = await A2ATask.create({
      taskId: crypto.randomUUID(),
      status: makeStatus(TASK_STATES.FAILED, "Ticket not found"),
      history: [message],
      artifacts: [],
      metadata: { createdBy: user?.email, ticketId, reason: "ticket_not_found" },
    });
    return buildTaskResponse(failedTask);
  }

  const taskDoc = await A2ATask.create({
    taskId: crypto.randomUUID(),
    contextId: ticketId,
    status: makeStatus(TASK_STATES.WORKING),
    history: [message],
    artifacts: [],
    metadata: { createdBy: user?.email, ticketId },
  });

  let suggestedResponse = "";
  try {
    suggestedResponse = await runAgent(
      ticket.description || ticket.subject,
      { email: ticket.customerEmail, customerId: ticket.customerId },
      ticket.conversation || []
    );
  } catch (err) {
    suggestedResponse = "Review the issue details, reproduce if possible, and provide next steps to the customer.";
  }

  const proposedUpdates = {};
  const detectedCategory = detectCategory(ticket.description || "");
  if (detectedCategory && detectedCategory !== ticket.category) {
    proposedUpdates.category = detectedCategory;
  }
  const inferredPriority = inferPriority(ticket.description || "");
  if (inferredPriority && inferredPriority !== ticket.priority) {
    proposedUpdates.priority = inferredPriority;
  }
  if (ticket.status === "open") {
    proposedUpdates.status = "in-progress";
  }

  let appliedUpdates = null;
  if (data.applyChanges && data.updates && typeof data.updates === "object") {
    const allowed = ["status", "priority", "category", "assignedTo"];
    const updatePayload = {};
    allowed.forEach((field) => {
      if (data.updates[field]) updatePayload[field] = data.updates[field];
    });

    const remarkText = typeof data.remark === "string" ? data.remark.trim() : "";
    if (user?.role === "agent" && !remarkText) {
      throw new Error("Remark is required for agent updates");
    }

    const result = await updateTicketByAgent(
      {
        ticketId,
        ...updatePayload,
        remark: remarkText || undefined,
        agentEmail: user?.email,
      },
      user,
      req
    );
    appliedUpdates = result?.ticket || null;
  }

  const responseSummary = [
    `Ticket ${ticketId} analyzed.`,
    suggestedResponse ? "Suggested response generated." : null,
    Object.keys(proposedUpdates).length ? "Proposed updates included." : null,
    appliedUpdates ? "Updates applied." : null,
  ]
    .filter(Boolean)
    .join(" ");

  const responseMessage = makeMessage("agent", [
    makeTextPart(responseSummary),
    makeDataPart({
      ticketId,
      suggestedResponse,
      proposedUpdates,
      appliedUpdates,
    }),
  ]);

  taskDoc.history.push(responseMessage);
  taskDoc.artifacts = [
    {
      name: "ticket-fix",
      parts: [
        makeTextPart(sanitizeString(responseSummary)),
        makeDataPart({
          ticketId,
          suggestedResponse,
          proposedUpdates,
          appliedUpdates,
        }),
      ],
    },
  ];
  taskDoc.status = makeStatus(TASK_STATES.COMPLETED);

  const updatedTask = await upsertTask(taskDoc, {
    status: taskDoc.status,
    history: taskDoc.history,
    artifacts: taskDoc.artifacts,
    metadata: { ...(taskDoc.metadata || {}), completedAt: new Date() },
  });

  return buildTaskResponse(updatedTask);
};

export const getTask = async (taskId, historyLength, user) => {
  const query = { taskId };
  if (user?.email) {
    query["metadata.createdBy"] = user.email;
  }
  const task = await A2ATask.findOne(query);
  if (!task) return null;
  return buildTaskResponse(task, historyLength);
};

export const listTasks = async ({ pageSize = 20, pageToken, historyLength }, user) => {
  const limit = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  const skip = pageToken ? parseInt(pageToken, 10) : 0;

  const query = user?.email ? { "metadata.createdBy": user.email } : {};
  const tasks = await A2ATask.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1);

  const hasNext = tasks.length > limit;
  const items = hasNext ? tasks.slice(0, limit) : tasks;

  return {
    tasks: items.map((task) => buildTaskResponse(task, historyLength)),
    nextPageToken: hasNext ? String(skip + limit) : undefined,
  };
};

export const cancelTask = async (taskId, user) => {
  const query = { taskId };
  if (user?.email) {
    query["metadata.createdBy"] = user.email;
  }
  const task = await A2ATask.findOne(query);
  if (!task) return null;

  const terminalStates = [TASK_STATES.COMPLETED, TASK_STATES.CANCELED, TASK_STATES.FAILED];
  if (terminalStates.includes(task.status?.state)) {
    return { task, cancelable: false };
  }

  task.status = makeStatus(TASK_STATES.CANCELED, "Task canceled by client");
  await task.save();
  return { task, cancelable: true };
};

export const a2aConstants = {
  TASK_STATES,
};
