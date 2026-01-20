import { Agent, Ticket } from "../../models/index.js";

/**
 * Validates if an agent has capacity to accept more tickets
 * @param {string} agentId - The agent's ID
 * @returns {Promise<boolean>} - True if agent has capacity, false otherwise
 */
export const validateAgentCapacity = async (agentId) => {
  const agent = await Agent.findById(agentId);
  if (!agent) {
    return false;
  }
  return agent.currentLoad < agent.maxLoad;
};

// Category detection based on keywords
const CATEGORY_KEYWORDS = {
  account: ["password", "login", "account", "profile", "username", "2fa", "authentication", "banned", "suspended"],
  billing: ["payment", "refund", "charge", "invoice", "subscription", "plan", "price", "money", "credit", "purchase"],
  technical: ["crash", "bug", "error", "lag", "performance", "install", "update", "driver", "connection"],
  gameplay: ["game", "level", "character", "item", "quest", "match", "rank", "progress", "save"],
  security: ["hack", "stolen", "compromised", "suspicious", "fraud", "scam", "phishing"],
};

// Detect category from ticket description
export const detectCategory = (description) => {
  const text = description.toLowerCase();
  let maxScore = 0;
  let detectedCategory = "general";

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }

  return detectedCategory;
};

// Find best available agent for a category
// Prioritizes category match, then falls back to "general" category agents
export const findAvailableAgent = async (category) => {
  // Step 1: Find agents who handle this specific category, are active, and have capacity
  // Strictly enforce currentLoad < maxLoad
  const categoryAgent = await Agent.findOne({
    categories: category,
    isActive: true,
    $expr: { $lt: ["$currentLoad", "$maxLoad"] }
  }).sort({ currentLoad: 1 }); // Assign to least loaded agent

  if (categoryAgent) {
    console.log(`✅ Found category specialist for ${category}: ${categoryAgent.name}`);
    return categoryAgent;
  }

  // Step 2: Fall back to agents with "general" category if no category specialist
  // Only fall back to "general" if the requested category is not already "general"
  if (category !== "general") {
    const generalAgent = await Agent.findOne({
      categories: "general",
      isActive: true,
      $expr: { $lt: ["$currentLoad", "$maxLoad"] }
    }).sort({ currentLoad: 1 });

    if (generalAgent) {
      console.log(`📋 No ${category} specialist available, assigning to general agent: ${generalAgent.name}`);
      return generalAgent;
    }
  }

  // No agent available with matching category or general category
  console.log(`⚠️ No available agent with capacity for category: ${category}`);
  return null;
};

// Auto-assign ticket to an agent
export const autoAssignTicket = async (ticket) => {
  const category = ticket.category || detectCategory(ticket.description || "");
  const agent = await findAvailableAgent(category);

  if (agent) {
    ticket.assignedTo = agent._id;
    ticket.category = category;
    
    // Use atomic increment for agent load
    await incrementAgentLoad(agent._id);
    
    // Add system message to conversation
    ticket.conversation.push({
      role: "system",
      content: `Ticket auto-assigned to ${agent.name} (${category} specialist)`,
    });

    console.log(`📋 Ticket ${ticket._id} assigned to ${agent.name} (${category})`);
    return agent;
  }

  console.log(`⚠️ No available agent for ticket ${ticket._id}`);
  return null;
};

// Release agent load when ticket is resolved/closed
// Uses atomic decrement with guard against negative values
export const releaseAgentLoad = async (ticket) => {
  if (ticket.assignedTo) {
    // First check current load to prevent going negative
    const agent = await Agent.findById(ticket.assignedTo);
    if (!agent) {
      console.warn(`⚠️ Agent ${ticket.assignedTo} not found when releasing load`);
      return;
    }
    
    if (agent.currentLoad <= 0) {
      console.warn(`⚠️ Agent ${agent.name} (${agent._id}) load would go negative, resetting to 0`);
      await Agent.findByIdAndUpdate(ticket.assignedTo, { currentLoad: 0 });
      return;
    }
    
    // Use atomic $inc operator for decrement
    await Agent.findByIdAndUpdate(ticket.assignedTo, { 
      $inc: { currentLoad: -1 } 
    });
  }
};

/**
 * Atomically increment agent load
 * @param {string} agentId - The agent's ID
 * @returns {Promise<void>}
 */
export const incrementAgentLoad = async (agentId) => {
  await Agent.findByIdAndUpdate(agentId, { 
    $inc: { currentLoad: 1 } 
  });
};

/**
 * Atomically decrement agent load with guard against negative values
 * @param {string} agentId - The agent's ID
 * @returns {Promise<void>}
 */
export const decrementAgentLoad = async (agentId) => {
  const agent = await Agent.findById(agentId);
  if (!agent) {
    console.warn(`⚠️ Agent ${agentId} not found when decrementing load`);
    return;
  }
  
  if (agent.currentLoad <= 0) {
    console.warn(`⚠️ Agent ${agent.name} (${agent._id}) load would go negative, resetting to 0`);
    await Agent.findByIdAndUpdate(agentId, { currentLoad: 0 });
    return;
  }
  
  // Use atomic $inc operator for decrement
  await Agent.findByIdAndUpdate(agentId, { 
    $inc: { currentLoad: -1 } 
  });
};

/**
 * Manually reassign a ticket from one agent to another
 * @param {string} ticketId - The ticket's ID
 * @param {string} fromAgentId - The current agent's ID
 * @param {string} toAgentId - The target agent's ID
 * @returns {Promise<{success: boolean, ticket: Object, fromAgent: Object, toAgent: Object}>}
 */
export const manualReassign = async (ticketId, fromAgentId, toAgentId) => {
  // Validate ticket exists
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Validate both agents exist
  const [fromAgent, toAgent] = await Promise.all([
    Agent.findById(fromAgentId),
    Agent.findById(toAgentId)
  ]);

  if (!fromAgent) {
    throw new Error("Source agent not found");
  }

  if (!toAgent) {
    throw new Error("Target agent not found");
  }

  // Validate target agent is active
  if (!toAgent.isActive) {
    throw new Error("Cannot reassign to inactive agent");
  }

  // Validate target agent has capacity
  if (toAgent.currentLoad >= toAgent.maxLoad) {
    throw new Error("Target agent has no capacity");
  }

  // Decrement old agent's load
  await decrementAgentLoad(fromAgentId);

  // Increment new agent's load
  await incrementAgentLoad(toAgentId);

  // Update ticket's assignedTo
  ticket.assignedTo = toAgentId;

  // Add system message to conversation
  ticket.conversation.push({
    role: "system",
    content: `Ticket manually reassigned from ${fromAgent.name} to ${toAgent.name}`,
    timestamp: new Date()
  });

  await ticket.save();

  console.log(`📋 Ticket ${ticketId} manually reassigned from ${fromAgent.name} to ${toAgent.name}`);

  return {
    success: true,
    ticket,
    fromAgent,
    toAgent
  };
};

// Get agent workload stats
export const getAgentWorkloads = async () => {
  return Agent.aggregate([
    {
      $lookup: {
        from: "tickets",
        localField: "_id",
        foreignField: "assignedTo",
        as: "tickets"
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        categories: 1,
        isActive: 1,
        currentLoad: 1,
        maxLoad: 1,
        openTickets: {
          $size: {
            $filter: {
              input: "$tickets",
              cond: { $in: ["$this.status", ["open", "in-progress"]] }
            }
          }
        }
      }
    }
  ]);
};

/**
 * Reassign all open/in-progress tickets from a deactivated agent to other available agents
 * @param {string} agentId - The deactivated agent's ID
 * @returns {Promise<{reassigned: Array, unassigned: Array}>} - Results of reassignment
 */
export const reassignAgentTickets = async (agentId) => {
  // Find all open/in-progress tickets for the agent
  const tickets = await Ticket.find({
    assignedTo: agentId,
    status: { $in: ["open", "in-progress"] }
  });

  const results = {
    reassigned: [],
    unassigned: []
  };

  for (const ticket of tickets) {
    // Attempt to find another available agent for this ticket's category
    const category = ticket.category || "general";
    const newAgent = await findAvailableAgent(category);

    if (newAgent && newAgent._id.toString() !== agentId.toString()) {
      // Reassign to new agent
      ticket.assignedTo = newAgent._id;
      ticket.conversation.push({
        role: "system",
        content: `Ticket reassigned to ${newAgent.name} due to previous agent deactivation`,
      });
      await ticket.save();

      // Increment new agent's load atomically
      await incrementAgentLoad(newAgent._id);

      results.reassigned.push({
        ticketId: ticket._id,
        newAgentId: newAgent._id,
        newAgentName: newAgent.name
      });

      console.log(`📋 Ticket ${ticket._id} reassigned from deactivated agent to ${newAgent.name}`);
    } else {
      // No available agent - mark as unassigned
      ticket.assignedTo = null;
      ticket.conversation.push({
        role: "system",
        content: "Ticket marked as unassigned - previous agent deactivated and no available agents",
      });
      await ticket.save();

      results.unassigned.push({
        ticketId: ticket._id
      });

      console.log(`⚠️ Ticket ${ticket._id} marked as unassigned - no available agent`);
    }
  }

  // Decrement the deactivated agent's load for all tickets that were reassigned or unassigned
  const totalTickets = tickets.length;
  if (totalTickets > 0) {
    // Reset the deactivated agent's load to 0 since all their tickets are being handled
    await Agent.findByIdAndUpdate(agentId, { currentLoad: 0 });
    console.log(`📊 Deactivated agent's load reset to 0 (${totalTickets} tickets processed)`);
  }

  return results;
};
