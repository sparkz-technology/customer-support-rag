import { Router } from "express";
import { runAgent } from "../services/agent.js";
import { requireAuth } from "../middleware/index.js";

const router = Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { ticketId, description } = req.body;
    const result = await runAgent(
      `Ticket ID: ${ticketId || "New"}. Issue: ${description}`,
      req.user.customerId
    );

    res.json({ success: true, response: result });
  } catch (err) {
    next(err);
  }
});

export default router;
