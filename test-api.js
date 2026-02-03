import "dotenv/config";

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
const TEST_EMAIL = "test@example.com";

let accessToken = null;

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  return res.json();
}

// Backend API Flow Test
async function runTests() {
  console.log("\n=== Customer Support RAG - Backend API Flow Test ===\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}\n`);

  try {
    // Step 1: Send OTP
    console.log("1. POST /api/auth/send-otp");
    const otpRes = await request("POST", "/api/auth/send-otp", { email: TEST_EMAIL });
    console.log("   ✓", otpRes.success ? "OTP sent" : "Error:", otpRes);

    // Step 2: Verify OTP and get access token
    console.log("\n2. POST /api/auth/verify-otp");
    const authRes = await request("POST", "/api/auth/verify-otp", { email: TEST_EMAIL, otp: "123456" });
    accessToken = authRes.accessToken;
    console.log("   ✓ Access Token:", accessToken ? "Received" : "Failed");

    if (!accessToken) {
      console.log("\n✗ Failed to authenticate. Stopping tests.");
      return;
    }

    // Step 3: Add knowledge documents
    console.log("\n3. POST /api/knowledge/documents");
    const docs = {
      documents: [
        {
          content: "To reset password: Click Forgot Password, enter email, check inbox for reset link.",
          metadata: { category: "account", topic: "password" }
        }
      ]
    };
    const addRes = await request("POST", "/api/knowledge/documents", docs);
    console.log("   ✓", addRes.success ? `Added ${addRes.count} documents` : `Error: ${addRes.error}`);

    // Wait for indexing
    await new Promise(r => setTimeout(r, 2000));

    // Step 4: Search knowledge base
    console.log("\n4. GET /api/knowledge/search?q=password");
    const searchRes = await request("GET", "/api/knowledge/search?q=password&limit=3");
    console.log("   ✓", searchRes.success ? `Found ${searchRes.results.length} documents` : `Error: ${searchRes.error}`);

    // Step 5: AI Triage
    console.log("\n5. POST /api/triage");
    const triageRes = await request("POST", "/api/triage", {
      description: "I forgot my password and cannot login"
    });
    if (triageRes.success && triageRes.response) {
      console.log("   ✓ AI Response:", triageRes.response.substring(0, 150) + "...");
    } else {
      console.log("   ✗ Error:", triageRes.error || "No response");
    }

    // Step 6: Analytics
    console.log("\n6. GET /api/analytics");
    const analyticsRes = await request("GET", "/api/analytics");
    if (analyticsRes.success) {
      console.log("   ✓ Status counts:", analyticsRes.totals.byStatus.length);
      console.log("   ✓ Priority counts:", analyticsRes.totals.byPriority.length);
      console.log("   ✓ Top intents:", analyticsRes.topIntents.length);
    } else {
      console.log("   ✗ Error:", analyticsRes.error);
    }

    console.log("\n✅ Backend API flow test completed!\n");
  } catch (error) {
    console.log("\n✗ Test failed:", error.message);
    console.log(error.stack);
  }
}

runTests();
