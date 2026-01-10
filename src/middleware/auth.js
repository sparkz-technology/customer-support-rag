import { User } from "../models/index.js";

export const requireAuth = async (req, res, next) => {
  const token = req.headers["x-session-token"];

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const user = await User.findOne({ sessionToken: token }).populate("customerId");

  if (!user) {
    return res.status(403).json({ error: "Session invalid." });
  }

  req.user = user;
  next();
};
