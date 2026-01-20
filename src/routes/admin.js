import { Router } from "express";
import { adminController } from "../controllers/index.js";
import { requireAuth, requireAdmin } from "../middleware/index.js";

const router = Router();

// All routes require auth + admin
router.use(requireAuth, requireAdmin);

// Stats
router.get("/stats", adminController.getStats);

// Tickets
router.get("/tickets", adminController.getTickets);

// Agents
router.get("/agents", adminController.getAgents);
router.post("/agents", adminController.createAgent);
router.patch("/agents/:id", adminController.updateAgent);
router.delete("/agents/:id", adminController.deleteAgent);

// Users
router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.updateUser);

// Customers
router.get("/customers", adminController.getCustomers);
router.patch("/customers/:id", adminController.updateCustomer);

// Audit Logs
router.get("/audit-logs", adminController.getAuditLogs);
router.get("/audit-logs/actions", adminController.getAuditLogActions);

export default router;
