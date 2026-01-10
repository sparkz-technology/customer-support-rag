import app from "./app.js";
import { CONFIG } from "./config/index.js";
import { connectDB } from "./config/database.js";

const start = async () => {
  await connectDB();
  app.listen(CONFIG.PORT, () => console.log(`Server active on port ${CONFIG.PORT}`));
};

start();
