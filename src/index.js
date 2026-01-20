import app from "./app.js";
import { CONFIG } from "./config/index.js";
import { connectDB } from "./config/database.js";
import { startSlaChecker } from "./services/ticket/sla-checker.js";

const start = async () => {
  await connectDB();
  
  // Start SLA breach checker
  startSlaChecker();
  
  app.listen(CONFIG.PORT, () => console.log(`Server active on port ${CONFIG.PORT}`));
};

start();
