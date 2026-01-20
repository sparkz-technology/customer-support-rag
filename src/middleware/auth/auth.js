import { User, Agent } from "../../models/index.js";

export const requireAuth = async (req, res, next) => {
  const token = req.headers["x-session-token"];

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const user = await User.findOne({ sessionToken: token })
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
