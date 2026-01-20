import { Router } from "express";
import { agentController } from "../controllers/index.js";
import { requireAuth, requireAgent } from "../middleware/index.js";

const router = Router();

// All routes require auth + agent role
router.use(requireAuth, requireAgent);

// Tickets
router.get("/tickets", agentController.getTickets);
router.get("/tickets/:id", agentController.getTicket);
router.post("/tickets/:id/reply", agentController.replyToTicket);
router.patch("/tickets/:id", agentController.updateTicket);

// Agents list (for assignment)
router.get("/agents", agentController.getAgents);

// Stats
router.get("/stats", agentController.getStats);

export default router;
