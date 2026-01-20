import { Router } from "express";

const router = Router();

// Internal webhook receiver - logs ticket events
router.post("/ticket-events", (req, res) => {
  const { event, ticket } = req.body;
  
  console.log("\n" + "=".repeat(50));
  console.log("🎫 TICKET WEBHOOK EVENT");
  console.log("=".repeat(50));
  console.log(`Event: ${event}`);
  console.log(`Ticket ID: ${ticket?._id}`);
  console.log(`Customer: ${ticket?.customerEmail}`);
  console.log(`Status: ${ticket?.status}`);
  console.log(`Priority: ${ticket?.priority}`);
  console.log(`Subject: ${ticket?.subject}`);
  console.log(`Description: ${ticket?.description?.substring(0, 100)}...`);
  console.log(`SLA Due: ${ticket?.slaDueAt}`);
  console.log(`SLA Breached: ${ticket?.slaBreached}`);
  if (ticket?.agentLogs?.length > 0) {
    console.log(`Agent Logs: ${ticket.agentLogs.length} entries`);
    ticket.agentLogs.slice(-2).forEach((log, i) => {
      console.log(`  [${i + 1}] ${log.substring(0, 80)}...`);
    });
  }
  console.log("=".repeat(50) + "\n");

  res.json({ success: true, received: event });
});

export default router;
