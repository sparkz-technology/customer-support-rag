import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler, apiLimiter } from "./middleware/index.js";

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

// Routes
app.use("/api", routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
