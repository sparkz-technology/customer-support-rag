import { Router } from "express";
import { authController } from "../controllers/index.js";
import { authLimiter, requireAuth, requireAdmin } from "../middleware/index.js";

const router = Router();

// Public routes
router.post("/send-otp", authLimiter, authController.sendOTP);
router.post("/verify-otp", authLimiter, authController.verifyOTP);

// Protected routes
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.getMe);

// Admin routes
router.get("/users", requireAuth, requireAdmin, authController.getUsers);
router.patch("/users/:id/role", requireAuth, requireAdmin, authController.updateUserRole);

export default router;
