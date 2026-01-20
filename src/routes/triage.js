import { Router } from "express";
import { runSimpleChat } from "../services/agent.js";
import { requireAuth } from "../middleware/index.js";

const router = Router();

// Quick AI chat - no ticket creation, just answers
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await runSimpleChat(description, req.user.email);

    res.json({ 
      success: true, 
      response,
    });
  } catch (err) {
    console.error("Triage error:", err.message);
    next(err);
  }
});

export default router;
