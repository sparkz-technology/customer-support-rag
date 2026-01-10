import { Router } from "express";
import authRoutes from "./auth.js";
import triageRoutes from "./triage.js";
import knowledgeRoutes from "./knowledge.js";
import analyticsRoutes from "./analytics.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/triage", triageRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
