import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler, apiLimiter } from "./middleware/index.js";
import { getAgentCard } from "./services/a2a/a2a.service.js";

const app = express();

// Security
app.use(helmet());
app.use(cors());

// Logging
app.use(morgan("dev"));

// Rate limiting
app.use("/api", apiLimiter);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// A2A Agent Card (public)
app.get("/.well-known/agent-card.json", (req, res) => {
  res.json(getAgentCard(req));
});

// Routes
app.use("/api", routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
