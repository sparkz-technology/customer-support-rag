import "dotenv/config";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { getPineconeIndex } from "../config/pinecone.js";
import { CONFIG } from "../config/index.js";

const knowledgeBase = [
  {
    content: "To reset your password: 1) Click 'Forgot Password' on login page 2) Enter your email 3) Check inbox for reset link 4) Create new password with at least 8 characters",
    metadata: { category: "account", topic: "password-reset" },
  },
  {
    content: "Billing cycles run monthly from your signup date. Invoices are sent 3 days before charge. You can view all invoices in Settings > Billing > Invoice History.",
    metadata: { category: "billing", topic: "invoices" },
  },
  {
    content: "To upgrade your plan: Go to Settings > Subscription > Change Plan. Select new plan and confirm. Changes take effect immediately, prorated charges apply.",
    metadata: { category: "billing", topic: "upgrade" },
  },
  {
    content: "Two-factor authentication (2FA) adds security to your account. Enable in Settings > Security > Two-Factor Auth. Supports authenticator apps and SMS.",
    metadata: { category: "security", topic: "2fa" },
  },
  {
    content: "API rate limits: Basic plan - 100 req/min, Premium - 500 req/min, Enterprise - unlimited. Rate limit headers included in all responses.",
    metadata: { category: "api", topic: "rate-limits" },
  },
  {
    content: "To cancel subscription: Settings > Subscription > Cancel Plan. Data retained for 30 days after cancellation. Refunds available within 14 days of charge.",
    metadata: { category: "billing", topic: "cancellation" },
  },
  {
    content: "Login issues troubleshooting: 1) Clear browser cache 2) Try incognito mode 3) Check caps lock 4) Reset password if needed 5) Contact support if persists.",
    metadata: { category: "account", topic: "login-issues" },
  },
  {
    content: "Enterprise features include: SSO integration, dedicated support, custom SLA, advanced analytics, audit logs, and priority feature requests.",
    metadata: { category: "plans", topic: "enterprise" },
  },
];

async function seedKnowledge() {
  try {
    console.log("Connecting to Pinecone...");
    const pineconeIndex = getPineconeIndex();

    if (!CONFIG.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY must be set in .env");
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: CONFIG.GOOGLE_API_KEY,
      model: "embedding-001",
    });

    const docs = knowledgeBase.map(
      (kb) =>
        new Document({
          pageContent: kb.content,
          metadata: { ...kb.metadata, seededAt: new Date().toISOString() },
        })
    );

    console.log(`Seeding ${docs.length} documents to Pinecone...`);

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex,
      namespace: CONFIG.PINECONE_NAMESPACE,
    });

    console.log("Knowledge base seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedKnowledge();
