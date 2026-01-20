import { Ticket } from "../models/index.js";
import { notifyWithRetry } from "./webhooks.js";
import { sendSlaBreachEmail, sendSLABreachAlert } from "./email.js";
import { auditLogger } from "./admin/audit-log.js";

// Check and update SLA breaches
export const checkSlaBreaches = async () => {
  const now = new Date();
  
  // Find tickets that should be marked as breached
  // Populate assignedTo to get agent email for notifications
  const breachedTickets = await Ticket.find({
    slaBreached: false,
    status: { $nin: ["resolved", "closed"] },
    slaDueAt: { $lt: now },
  }).populate("assignedTo");

  let updated = 0;
  for (const ticket of breachedTickets) {
    ticket.slaBreached = true;
    ticket.conversation.push({
      role: "system",
      content: `⚠️ SLA BREACHED - Ticket was due at ${ticket.slaDueAt.toISOString()}`,
      timestamp: now,
    });
    await ticket.save();
    
    // Send notifications
    notifyWithRetry("ticket.sla-breach", { ticket: ticket.toObject() }).catch(console.error);
    
    // Send email to customer
    sendSlaBreachEmail(ticket.customerEmail, ticket).catch(console.error);
    
    // Send email to assigned agent if one exists
    if (ticket.assignedTo && ticket.assignedTo.email) {
      sendSLABreachAlert(ticket, ticket.assignedTo.email).catch(console.error);
    }
    
    auditLogger.ticketSlaBreached(ticket).catch(console.error);
    
    updated++;
  }

  if (updated > 0) {
    console.log(`⚠️ SLA Check: ${updated} tickets marked as breached`);
  }

  return updated;
};

// Start periodic SLA checking (every 5 minutes)
export const startSlaChecker = () => {
  // Run immediately on startup
  checkSlaBreaches().catch(console.error);
  
  // Then run every 5 minutes
  setInterval(() => {
    checkSlaBreaches().catch(console.error);
  }, 5 * 60 * 1000);
  
  console.log("✓ SLA breach checker started (runs every 5 minutes)");
};
