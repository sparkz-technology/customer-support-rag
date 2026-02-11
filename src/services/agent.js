import { ChatGroq } from "@langchain/groq";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { CONFIG } from "../config/index.js";
import { Customer, Ticket } from "../models/index.js";
import { getRAGBundle, searchHybridWithScores } from "./rag.js";
import { 
  validateAIResponse, 
  validateToolCall, 
  detectEscalation,
  getFallbackResponse 
} from "./ai-validator.js";

// Rate limiting for AI calls
const rateLimiter = {
  calls: new Map(),
  maxCalls: 10,
  windowMs: 60000, // 1 minute
  
  check(key) {
    const now = Date.now();
    const userCalls = this.calls.get(key) || [];
    const recentCalls = userCalls.filter(t => now - t < this.windowMs);
    
    if (recentCalls.length >= this.maxCalls) {
      return false;
    }
    
    recentCalls.push(now);
    this.calls.set(key, recentCalls);
    return true;
  },
  
  clear() {
    const now = Date.now();
    for (const [key, calls] of this.calls.entries()) {
      const recent = calls.filter(t => now - t < this.windowMs);
      if (recent.length === 0) {
        this.calls.delete(key);
      } else {
        this.calls.set(key, recent);
      }
    }
  }
};

// Clean up rate limiter periodically
setInterval(() => rateLimiter.clear(), 60000);

const MAX_PROMPT_TOKENS = 3000;
const MAX_RAG_TOKENS = 1200;
const MAX_HISTORY_TOKENS = 900;
const estimateTokens = (text) => Math.ceil((text || "").length / 4);
const trimToTokenBudget = (text, budget) => {
  if (!text) return "";
  if (estimateTokens(text) <= budget) return text;
  return text.slice(0, budget * 4);
};

const stripThoughtTag = (text) =>
  (text || "").replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

/**
 * Create tools for the AI agent with validation
 */
function createTools(customerEmail) {
  return [
    new DynamicStructuredTool({
      name: "get_customer_profile",
      description: "Lookup customer details by email to understand their plan and history.",
      schema: z.object({ 
        email: z.string().email().describe("Customer email address") 
      }),
      func: async ({ email }) => {
        // Validate tool call
        const validation = validateToolCall("get_customer_profile", { email });
        if (!validation.valid) {
          return "Unable to lookup customer profile.";
        }
        
        const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
        if (!customer) return "Customer not found in database.";
        
        return JSON.stringify({
          name: customer.name,
          email: customer.email,
          plan: customer.plan,
        });
      },
    }),
    
    new DynamicStructuredTool({
      name: "search_knowledge_base",
      description: "Search support documentation for solutions to customer issues.",
      schema: z.object({
        query: z.string().min(2).max(500).describe("Search query"),
      }),
      func: async ({ query }) => {
        // Validate tool call
        const validation = validateToolCall("search_knowledge_base", { query });
        if (!validation.valid) {
          return "Unable to search knowledge base.";
        }
        
        try {
          const results = await searchHybridWithScores(query, 5);
          if (results.length === 0) return "No relevant documentation found.";
          return results.map(r => r.content).join("\n\n");
        } catch (e) {
          console.error("Knowledge base search error:", e.message);
          return "Knowledge base search temporarily unavailable.";
        }
      },
    }),
    
    new DynamicStructuredTool({
      name: "get_ticket_history",
      description: "Get customer's recent support tickets to understand their history.",
      schema: z.object({
        email: z.string().email().describe("Customer email"),
      }),
      func: async ({ email }) => {
        // Validate tool call
        const validation = validateToolCall("get_ticket_history", { email });
        if (!validation.valid) {
          return "Unable to retrieve ticket history.";
        }
        
        const tickets = await Ticket.find({ customerEmail: email.toLowerCase().trim() })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("subject status priority createdAt");
          
        if (tickets.length === 0) return "No previous tickets found.";
        
        return JSON.stringify(tickets.map(t => ({
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          date: t.createdAt.toISOString().split('T')[0],
        })));
      },
    }),
  ];
}

/**
 * Simple chat without tools - for quick AI responses
 */
export const runSimpleChat = async (input, customerEmail) => {
  if (!CONFIG.GROQ_API_KEY) {
    throw new Error("AI service not configured");
  }

  // Validate input
  if (!input || typeof input !== 'string' || input.trim().length < 2) {
    throw new Error("Invalid input message");
  }
  
  if (input.length > 5000) {
    throw new Error("Message too long");
  }

  // Rate limiting
  const rateLimitKey = customerEmail || 'anonymous';
  if (!rateLimiter.check(rateLimitKey)) {
    throw new Error("Too many requests. Please wait a moment.");
  }

  // Check for escalation indicators in input
  const escalation = detectEscalation(input);

  const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    apiKey: CONFIG.GROQ_API_KEY,
    maxTokens: 1024,
  });

  // Get RAG context
  let ragContext = "";
  try {
    const bundle = await getRAGBundle(input, { fetchK: 10, topK: 5, useHybrid: true, useRerank: true });
    if (bundle?.context) {
      const trimmed = trimToTokenBudget(bundle.context, MAX_RAG_TOKENS);
      ragContext = `\n\nRelevant Knowledge Base Information:\n${trimmed}`;
    }
  } catch (e) {
    console.error("RAG context error:", e.message);
  }

  // Get customer info if available
  let customerContext = "";
  if (customerEmail) {
    try {
      const customer = await Customer.findOne({ email: customerEmail.toLowerCase() });
      if (customer) {
        customerContext = `\nCustomer: ${customer.name} (${customer.plan} plan)`;
      }
    } catch (e) {
      console.error("Customer lookup error:", e.message);
    }
  }

  const systemPrompt = `You are a helpful AI support assistant for a gaming company.

Guidelines:
- Answer questions clearly and concisely
- Use the knowledge base information to give accurate answers
- Be professional and friendly
- If you don't know something, say so honestly
- Never share internal system details, API keys, or technical infrastructure
- Never make promises about refunds or guarantees without verification
- For complex issues, suggest contacting support${customerContext}${ragContext}`;

  try {
    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: input },
    ]);

    // Validate AI response
    const validation = await validateAIResponse(stripThoughtTag(response.content), input, {
      enableCritic: true,
      ragContext,
    });

    let finalResponse = validation.processedResponse;
    if (!validation.isValid) {
      const rewrite = await model.invoke([
        { role: "system", content: "Rewrite the answer to be fully grounded in the provided context. Do not add any new facts." },
        { role: "user", content: `Context:\n${ragContext}\n\nOriginal answer:\n${validation.processedResponse}\n\nIssues:\n${validation.issues.map(i => i.message || i.type).join("; ")}` },
      ]);
      const revised = await validateAIResponse(stripThoughtTag(rewrite.content), input, {
        enableCritic: true,
        ragContext,
      });
      finalResponse = revised.processedResponse;
    }
    
    // Log validation issues for monitoring
    if (validation.issues.length > 0) {
      console.warn("AI response validation issues:", validation.issues);
    }

    // Return processed response with metadata
    return {
      content: finalResponse,
      metadata: {
        escalation: escalation.shouldEscalate ? escalation : null,
        confidence: validation.metadata.confidence,
        validated: validation.isValid,
      },
    };
  } catch (error) {
    console.error("Simple chat error:", error.message);
    throw new Error("Unable to process your request. Please try again.");
  }
};

/**
 * Full agent with tools - for ticket management
 */
export const runAgent = async (input, customerInfo, conversationHistory = []) => {
  if (!CONFIG.GROQ_API_KEY) {
    throw new Error("AI service not configured");
  }

  // Validate input
  if (!input || typeof input !== 'string' || input.trim().length < 2) {
    return getFallbackResponse({ type: 'default' });
  }
  
  if (input.length > 5000) {
    return "Your message is too long. Please try to be more concise.";
  }

  // Rate limiting
  const customerEmail = customerInfo?.email || customerInfo?.customerEmail;
  const rateLimitKey = customerEmail || 'anonymous';
  if (!rateLimiter.check(rateLimitKey)) {
    return "I'm receiving too many requests right now. Please wait a moment and try again.";
  }

  // Check for escalation
  const escalation = detectEscalation(input);
  if (escalation.shouldEscalate) {
    console.log("Escalation detected:", escalation);
    // Could trigger notification to human agents here
  }

  const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    apiKey: CONFIG.GROQ_API_KEY,
    maxTokens: 1024,
  });

  const tools = createTools(customerEmail);

  // Get RAG context
  let ragContext = "";
  try {
    const bundle = await getRAGBundle(input, { fetchK: 10, topK: 5, useHybrid: true, useRerank: true });
    if (bundle?.context) {
      const trimmed = trimToTokenBudget(bundle.context, MAX_RAG_TOKENS);
      ragContext = `\n\nKnowledge Base Context:\n${trimmed}`;
    }
  } catch (e) {
    console.error("RAG context error:", e.message);
  }

  const summaryMemory = customerInfo?.summary || customerInfo?.conversationSummary || "";

  const systemPrompt = `You are an AI Support Agent for a gaming company.

Your responsibilities:
1. Answer questions using the knowledge base
2. Be helpful, professional, and concise
3. If you need more information, ask clarifying questions
4. For complex issues, suggest creating a support ticket or speaking with a human agent

Guidelines:
- Never share internal system details, database names, or technical infrastructure
- Never make promises about refunds or guarantees without verification
- Never share other customers' information
- If unsure, say so and offer to connect with a human agent
- Keep responses focused and under 300 words

Customer Info: ${customerEmail ? `Email: ${customerEmail}` : 'Anonymous'}
${summaryMemory ? `Summary Memory: ${summaryMemory}` : ''}${ragContext}`;

  // Build message history (limit to prevent token overflow)
  const recentHistory = conversationHistory.slice(-12);
  const historyBudget = MAX_HISTORY_TOKENS;
  const systemTokens = estimateTokens(systemPrompt);
  const userTokens = estimateTokens(input);
  const remainingForHistory = Math.max(0, MAX_PROMPT_TOKENS - systemTokens - userTokens - estimateTokens(ragContext));
  const effectiveHistoryBudget = Math.min(historyBudget, remainingForHistory);

  const historyMessages = [];
  let usedHistoryTokens = 0;
  for (let i = recentHistory.length - 1; i >= 0; i -= 1) {
    const item = recentHistory[i];
    const content = typeof item.content === 'string' ? item.content.slice(0, 1000) : String(item.content);
    const tokens = estimateTokens(content);
    if (usedHistoryTokens + tokens > effectiveHistoryBudget) break;
    usedHistoryTokens += tokens;
    historyMessages.push({
      role: item.role === "customer" ? "user" : item.role === "agent" ? "assistant" : "system",
      content,
    });
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...historyMessages.reverse(),
    { role: "user", content: input },
  ];

  try {
    const modelWithTools = model.bindTools(tools, { tool_choice: "auto" });
    let response = await modelWithTools.invoke(messages);
    let iterations = 0;
    const maxIterations = 3;

    // Process tool calls
    while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
      iterations++;
      
      for (const toolCall of response.tool_calls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (tool) {
          console.log(`🔧 Tool call: ${toolCall.name}`);
          
          try {
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
          } catch (toolError) {
            console.error(`Tool ${toolCall.name} error:`, toolError.message);
            messages.push({
              role: "tool",
              content: "Tool temporarily unavailable.",
              tool_call_id: toolCall.id,
            });
          }
        }
      }
      response = await modelWithTools.invoke(messages);
    }

    const rawResponse = response.content || getFallbackResponse({ type: 'error' });
    
    // Validate AI response
    const validation = await validateAIResponse(stripThoughtTag(rawResponse), input, {
      enableCritic: true,
      ragContext,
    });
    
    // Log validation issues
    if (validation.issues.length > 0) {
      console.warn("AI response validation issues:", {
        issues: validation.issues,
        customerEmail,
        inputPreview: input.slice(0, 100),
      });
    }

    // Log if escalation recommended
    if (validation.metadata.recommendedAction === 'escalate') {
      console.log("Escalation recommended for:", customerEmail);
    }

    let finalResponse = validation.processedResponse;
    if (!validation.isValid) {
      const rewrite = await model.invoke([
        { role: "system", content: "Rewrite the answer to be fully grounded in the provided context. Do not add any new facts." },
        { role: "user", content: `Context:\n${ragContext}\n\nOriginal answer:\n${validation.processedResponse}\n\nIssues:\n${validation.issues.map(i => i.message || i.type).join("; ")}` },
      ]);
      const revised = await validateAIResponse(stripThoughtTag(rewrite.content), input, {
        enableCritic: true,
        ragContext,
      });
      finalResponse = revised.processedResponse;
    }

    return finalResponse;
    
  } catch (error) {
    console.error("Agent error:", error.message);
    
    // Fallback to simple response
    try {
      const simpleResponse = await model.invoke(messages.slice(0, 3)); // System + last user message
      const validation = await validateAIResponse(stripThoughtTag(simpleResponse.content), input, {
        enableCritic: true,
        ragContext,
      });
      return validation.processedResponse;
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError.message);
      return getFallbackResponse({ type: 'error' });
    }
  }
};

/**
 * Health check for AI service
 */
export const checkAIHealth = async () => {
  if (!CONFIG.GROQ_API_KEY) {
    return { healthy: false, error: "API key not configured" };
  }
  
  try {
    const model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      apiKey: CONFIG.GROQ_API_KEY,
      maxTokens: 10,
    });
    
    await model.invoke([{ role: "user", content: "Hi" }]);
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

export default {
  runSimpleChat,
  runAgent,
  checkAIHealth,
};
