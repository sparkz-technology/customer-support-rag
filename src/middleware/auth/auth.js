import jwt from "jsonwebtoken";
import { User } from "../../models/index.js";
import { CONFIG } from "../../config/index.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  // Prefer JWT bearer token
  if (bearerToken) {
    try {
      const payload = jwt.verify(bearerToken, CONFIG.JWT_SECRET);
      const user = await User.findById(payload.sub)
        .populate("customerId")
        .populate("agentId");
      if (!user) {
        return res.status(403).json({ error: "Session invalid." });
      }
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  }

  // Legacy session token fallback
  const legacyToken = req.headers["x-session-token"];
  if (!legacyToken) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const user = await User.findOne({ sessionToken: legacyToken })
    .populate("customerId")
    .populate("agentId");

  if (!user) {
    return res.status(403).json({ error: "Session invalid." });
  }

  req.user = user;
  next();
};

// Role-based middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

export const requireAgent = requireRole("agent", "admin");
export const requireAdmin = requireRole("admin");
