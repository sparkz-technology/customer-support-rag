import app from "./app.js";
import { CONFIG } from "./config/index.js";
import { connectDB } from "./config/database.js";
import { startSlaChecker } from "./services/ticket/sla-checker.js";

const validateConfig = () => {
  const warnings = [];
  const errors = [];

  // ── Required API keys (server will NOT start without these) ──
  if (!CONFIG.GROQ_API_KEY) {
    errors.push('❌ GROQ_API_KEY is missing - AI features will not work');
  } else {
    console.log('✅ GROQ_API_KEY configured');
  }

  if (!CONFIG.GOOGLE_API_KEY) {
    errors.push('❌ GOOGLE_API_KEY is missing - Embeddings/RAG will not work');
  } else {
    console.log('✅ GOOGLE_API_KEY configured');
  }

  if (!CONFIG.PINECONE_API_KEY) {
    errors.push('❌ PINECONE_API_KEY is missing - Vector store will not work');
  } else {
    console.log('✅ PINECONE_API_KEY configured');
  }

  // ── Security checks ──
  if (CONFIG.JWT_SECRET === 'dev_jwt_secret_change_me') {
    warnings.push('⚠️  JWT_SECRET is using the default dev value – rotate for production');
  }
  if (CONFIG.JWT_REFRESH_SECRET === 'dev_refresh_secret_change_me') {
    warnings.push('⚠️  JWT_REFRESH_SECRET is using the default dev value – rotate for production');
  }

  // ── Optional services (graceful degradation) ──
  if (!CONFIG.JINA_API_KEY) {
    warnings.push('⚠️  JINA_API_KEY not configured - Jina re-ranker disabled, falling back to LLM rerank');
  } else {
    console.log('✅ JINA_API_KEY configured');
  }

  if (!CONFIG.SMTP_HOST || !CONFIG.SMTP_USER || !CONFIG.SMTP_PASS) {
    warnings.push('⚠️  Email (SMTP) not configured - Notifications disabled');
  } else {
    console.log('✅ SMTP configured');
  }

  if (!CONFIG.WEBHOOK_URL) {
    warnings.push('⚠️  WEBHOOK_URL not configured - Webhook notifications disabled');
  } else {
    console.log('✅ WEBHOOK_URL configured');
  }

  if (!CONFIG.A2A_PUBLIC_URL) {
    warnings.push('⚠️  A2A_PUBLIC_URL not configured - A2A agent card discovery disabled');
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('\n' + warnings.join('\n'));
  }

  // Display errors and exit if critical
  if (errors.length > 0) {
    console.error('\n🚨 Configuration Errors:\n' + errors.join('\n'));
    console.error('\nPlease check your .env file and ensure all required keys are set.\n');
    process.exit(1);
  }

  console.log('✅ Configuration validated\n');
};

const start = async () => {
  console.log('🚀 Starting Customer Support RAG System...\n');
  
  validateConfig();
  
  await connectDB();
  
  // Start SLA breach checker
  startSlaChecker();
  
  app.listen(CONFIG.PORT, () => console.log(`🌐 Server active on port ${CONFIG.PORT}`));
};

start();
