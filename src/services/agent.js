import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { CONFIG } from "../config/index.js";
import { Customer, Ticket } from "../models/index.js";
import { getRAGContext, searchWithScores } from "./rag.js";
import { notifyTicketEvent } from "./webhooks.js";

const SLA_HOURS = {
  low: 72,
  medium: 48,
  high: 24,
  urgent: 8,
};

const computeSlaDueAt = (priority) => {
  const hours = SLA_HOURS[priority] ?? SLA_HOURS.medium;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

function createTools() {
  return [
    new DynamicStructuredTool({
      name: "get_customer_profile",
      description: "Lookup customer details in MongoDB using their email.",
      schema: z.object({ email: z.string().describe("Customer email address") }),
      func: async ({ email }) => {
        const customer = await Customer.findOne({ email });
        return customer ? JSON.stringify(customer) : "Customer record not found.";
      },
    }),
    new DynamicStructuredTool({
      name: "manage_mongodb_ticket",
      description: "Create or update tickets in the database.",
      schema: z.object({
        action: z.enum(["create", "update"]).describe("Action to perform"),
        email: z.string().describe("Customer email"),
        description: z.string().describe("Ticket description or update"),
        ticketId: z.string().optional().describe("Ticket ID for updates"),
        updateStatus: z.string().optional().describe("New status for ticket"),
        priority: z
          .enum(["low", "medium", "high", "urgent"])
          .optional()
          .describe("Priority level"),
      }),
      func: async ({ action, email, description, ticketId, updateStatus, priority }) => {
        try {
          const customer = await Customer.findOne({ email });
          const priorityToUse = priority || "medium";

          if (action === "update" && ticketId) {
            const updatePayload = {
              status: updateStatus || "in-progress",
              $push: { agentLogs: description },
            };

            if (priority) {
              updatePayload.priority = priorityToUse;
              updatePayload.slaDueAt = computeSlaDueAt(priorityToUse);
            }

            if (updateStatus === "resolved") {
              updatePayload.resolvedAt = new Date();
            }

            const updated = await Ticket.findByIdAndUpdate(ticketId, updatePayload, {
              new: true,
            });

            if (updated) {
              updated.slaBreached =
                !!updated.slaDueAt && updated.status !== "resolved" && updated.slaDueAt < new Date();
              await updated.save();
              await notifyTicketEvent("ticket.updated", updated.toObject());
            }

            return `Ticket ${ticketId} updated successfully.`;
          } else {
            const newTicket = await Ticket.create({
              customerId: customer ? customer._id : null,
              customerEmail: email,
              description: description,
              subject: "Auto-Generated Support Ticket",
              priority: priorityToUse,
              slaDueAt: computeSlaDueAt(priorityToUse),
            });
            newTicket.slaBreached =
              !!newTicket.slaDueAt && newTicket.status !== "resolved" && newTicket.slaDueAt < new Date();
            await newTicket.save();
            await notifyTicketEvent("ticket.created", newTicket.toObject());
            return `New ticket created with ID: ${newTicket._id}`;
          }
        } catch (e) {
          return `Database Error: ${e.message}`;
        }
      },
    }),
    new DynamicStructuredTool({
      name: "search_knowledge_base",
      description:
        "Search the knowledge base for relevant support documentation and solutions.",
      schema: z.object({
        query: z.string().describe("Search query for finding relevant documents"),
        limit: z
          .number()
          .optional()
          .describe("Number of results to return (default 3)"),
      }),
      func: async ({ query, limit = 3 }) => {
        try {
          const results = await searchWithScores(query, limit);
          if (results.length === 0) return "No relevant documents found.";
          return JSON.stringify(results, null, 2);
        } catch (e) {
          return `Search Error: ${e.message}`;
        }
      },
    }),
  ];
}

function initializeAgent() {
  if (!CONFIG.LLM7_IO_API_KEY) {
    throw new Error("LLM7_IO_API_KEY not configured. Set it in .env");
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    openAIApiKey: CONFIG.LLM7_IO_API_KEY,
    configuration: {
      baseURL: CONFIG.LLM7_IO_BASE_URL,
    },
  });

  const tools = createTools();

  return { model, tools };
}

export const runAgent = async (input, customerInfo) => {
  const { model, tools } = initializeAgent();

  // Get RAG context for the query
  let ragContext = "";
  try {
    const context = await getRAGContext(input, 3);
    if (context) {
      ragContext = `\n\nRelevant Knowledge Base Context:\n${context}`;
    }
  } catch (e) {
    console.error("RAG context error:", e.message);
  }

  const systemPrompt = `You are an Autonomous Support Agent. Use MongoDB tools to verify customer status and manage ticket records.
Use the search_knowledge_base tool to find relevant documentation when needed.
Be professional and concise.
Customer Info: ${JSON.stringify(customerInfo)}${ragContext}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: input },
  ];

  const modelWithTools = model.bindTools(tools, {
    tool_choice: "auto",
  });

  let response = await modelWithTools.invoke(messages);

  while (response.tool_calls && response.tool_calls.length > 0) {
    for (const toolCall of response.tool_calls) {
      const tool = tools.find((t) => t.name === toolCall.name);
      if (tool) {
        const result = await tool.invoke(toolCall.args);
        messages.push({
          role: "assistant",
          content: response.content || "",
          tool_calls: [toolCall],
        });
        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }
    }
    response = await modelWithTools.invoke(messages);
  }

  return response.content;
};
