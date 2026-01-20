import { Router } from "express";
import { ticketController } from "../controllers/index.js";
import { requireAuth } from "../middleware/index.js";

const router = Router();

router.post("/", requireAuth, ticketController.createTicket);
router.get("/", requireAuth, ticketController.getTickets);
router.get("/:id", requireAuth, ticketController.getTicket);
router.post("/:id/messages", requireAuth, ticketController.addMessage);
router.patch("/:id/status", requireAuth, ticketController.updateStatus);

export default router;
