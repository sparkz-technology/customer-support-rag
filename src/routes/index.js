import { Router } from "express";
import authRoutes from "./auth.js";
import triageRoutes from "./triage.js";
import knowledgeRoutes from "./knowledge.js";
import analyticsRoutes from "./analytics.js";
import webhookRoutes from "./webhooks.js";
import ticketRoutes from "./tickets.js";
import dashboardRoutes from "./dashboard.js";
import agentRoutes from "./agent.js";
import adminRoutes from "./admin.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/triage", triageRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/tickets", ticketRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/agent", agentRoutes);
router.use("/admin", adminRoutes);

export default router;
