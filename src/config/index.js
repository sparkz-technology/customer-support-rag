import "dotenv/config";

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/auto_triager",
  JINA_API_KEY: process.env.JINA_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX: process.env.PINECONE_INDEX || "auto-triager",
  PINECONE_NAMESPACE: process.env.PINECONE_NAMESPACE || "support-docs",
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  JWT_SECRET: process.env.JWT_SECRET || "dev_jwt_secret_change_me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || "15m",
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || "30d",
};
