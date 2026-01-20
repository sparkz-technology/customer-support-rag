import "dotenv/config";
import fs from "fs";

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
let sessionToken = null;

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  if (sessionToken) headers["x-session-token"] = sessionToken;
  
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text, status: res.status };
  }
}

async function uploadFile(path, filePath, category, topic) {
  const formData = new FormData();
  const fileContent = fs.readFileSync(filePath);
  formData.append("file", new Blob([fileContent]), filePath.split("/").pop());
  formData.append("category", category);
  formData.append("topic", topic);

  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: { "x-session-token": sessionToken },
    body: formData
  });
  return res.json();
}

async function runFullTest() {
  console.log("\n" + "=".repeat(60));
  console.log("   FULL FEATURE TEST - Customer Support RAG System");
  console.log("=".repeat(60) + "\n");

  // 1. Auth
  console.log("📧 AUTHENTICATION");
  console.log("-".repeat(40));
  
  const otpRes = await request("POST", "/api/auth/send-otp", { email: "alice@example.com" });
  console.log("  Send OTP:", otpRes.success ? "✓" : "✗", otpRes.message || otpRes.error);
  
  const authRes = await request("POST", "/api/auth/verify-otp", { email: "alice@example.com", otp: "123456" });
  sessionToken = authRes.sessionToken;
  console.log("  Verify OTP:", sessionToken ? "✓ Token received" : "✗ Failed");

  // 2. Knowledge Base - Upload File
  console.log("\n📚 KNOWLEDGE BASE");
  console.log("-".repeat(40));
  
  const uploadRes = await uploadFile("/api/knowledge/upload", "docs/gaming-support.txt", "gaming", "support");
  console.log("  Upload gaming-support.txt:", uploadRes.success ? `✓ ${uploadRes.chunks} chunks` : `✗ ${uploadRes.error}`);

  // Wait for indexing
  await new Promise(r => setTimeout(r, 2000));

  // 3. Knowledge Search Tests
  console.log("\n🔍 KNOWLEDGE SEARCH");
  console.log("-".repeat(40));
  
  const searches = ["refund policy", "account banned", "game crashes", "payment failed"];
  for (const q of searches) {
    const res = await request("GET", `/api/knowledge/search?q=${encodeURIComponent(q)}&limit=2`);
    console.log(`  "${q}":`, res.success ? `✓ ${res.results.length} results` : `✗ ${res.error}`);
  }

  // 4. AI Triage - Various Scenarios
  console.log("\n🤖 AI TRIAGE (with RAG + Tools)");
  console.log("-".repeat(40));
  
  const scenarios = [
    { desc: "I want a refund for my season pass", expect: "refund" },
    { desc: "My account got banned for no reason, please help", expect: "ban" },
    { desc: "Game keeps crashing after the update", expect: "crash" },
    { desc: "I was charged but didn't receive my gems", expect: "payment" },
    { desc: "How do I enable two-factor authentication?", expect: "2fa" },
  ];

  for (const s of scenarios) {
    const res = await request("POST", "/api/triage", { description: s.desc });
    const preview = res.response ? res.response.substring(0, 80) + "..." : res.error;
    console.log(`  "${s.desc.substring(0, 40)}..."`);
    console.log(`    ${res.success ? "✓" : "✗"} ${preview}`);
  }

  // 5. Analytics
  console.log("\n📊 ANALYTICS");
  console.log("-".repeat(40));
  
  const analytics = await request("GET", "/api/analytics");
  if (analytics.success) {
    console.log("  Tickets by Status:");
    analytics.totals.byStatus.forEach(s => console.log(`    - ${s.status}: ${s.count}`));
    console.log("  Tickets by Priority:");
    analytics.totals.byPriority.forEach(p => console.log(`    - ${p.priority}: ${p.count}`));
    if (analytics.metrics.averageResolutionHours) {
      console.log(`  Avg Resolution: ${analytics.metrics.averageResolutionHours.toFixed(1)} hours`);
    }
    console.log("  Top Intents:");
    analytics.topIntents.forEach(i => console.log(`    - ${i.intent}: ${i.count}`));
  } else {
    console.log("  ✗", analytics.error);
  }

  // 6. Test with seeded customer (premium user)
  console.log("\n👤 CUSTOMER CONTEXT TEST");
  console.log("-".repeat(40));
  
  // Login as premium customer
  await request("POST", "/api/auth/send-otp", { email: "bob@example.com" });
  const bobAuth = await request("POST", "/api/auth/verify-otp", { email: "bob@example.com", otp: "123456" });
  sessionToken = bobAuth.sessionToken;
  
  const premiumRes = await request("POST", "/api/triage", { 
    description: "What features do I get with my current plan?" 
  });
  console.log("  Premium user query:");
  console.log(`    ${premiumRes.success ? "✓" : "✗"} ${premiumRes.response?.substring(0, 100) || premiumRes.error}...`);

  console.log("\n" + "=".repeat(60));
  console.log("   TEST COMPLETE");
  console.log("=".repeat(60) + "\n");
}

runFullTest().catch(console.error);
