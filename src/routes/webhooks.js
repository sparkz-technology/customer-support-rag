import { Router } from "express";
import crypto from "crypto";
import { CONFIG } from "../config/index.js";
import { schemas } from "../services/validator.js";

const router = Router();

const safeEqual = (a, b) => {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const verifyWebhookAuth = (req) => {
  if (!CONFIG.WEBHOOK_SECRET) return true;

  const signature = req.header("x-webhook-signature");
  const sharedSecret = req.header("x-webhook-secret");

  if (signature) {
    const expected = crypto
      .createHmac("sha256", CONFIG.WEBHOOK_SECRET)
      .update(JSON.stringify(req.body || {}))
      .digest("hex");
    return safeEqual(signature, expected);
  }

  if (sharedSecret) {
    return safeEqual(sharedSecret, CONFIG.WEBHOOK_SECRET);
  }

  return false;
};

// Internal webhook receiver - logs ticket events
router.post("/ticket-events", (req, res) => {
  if (!verifyWebhookAuth(req)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const { event, ticket } = req.body;
  const validation = schemas.webhookTicketEvent({ event, ticket });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0], details: validation.errors });
  }
  
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
