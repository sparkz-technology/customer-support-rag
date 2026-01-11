import "dotenv/config";

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/auto_triager",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX: process.env.PINECONE_INDEX || "auto-triager",
  PINECONE_NAMESPACE: process.env.PINECONE_NAMESPACE || "support-docs",
  WEBHOOK_URL: process.env.WEBHOOK_URL,
};
