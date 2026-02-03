import "dotenv/config";

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
let accessToken = null;

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  
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

async function runFeatureTests() {
  console.log("\n" + "=".repeat(60));
  console.log("   NEW FEATURES TEST");
  console.log("=".repeat(60));

  // Auth
  console.log("\n📧 AUTH");
  console.log("-".repeat(40));
  await request("POST", "/api/auth/send-otp", { email: "alice@example.com" });
  const auth = await request("POST", "/api/auth/verify-otp", { email: "alice@example.com", otp: "123456" });
  accessToken = auth.accessToken;
  console.log("  Login:", accessToken ? "✓" : "✗");

  // 1. Create ticket with auto-assignment
  console.log("\n🎫 TICKET SYSTEM (Auto-Assignment)");
  console.log("-".repeat(40));
  
  const ticket1 = await request("POST", "/api/tickets", {
    subject: "Password reset not working",
    description: "I tried to reset my password but the email never arrives. I've checked spam folder too.",
    priority: "high"
  });
  console.log("  Create ticket:", ticket1.success ? "✓" : "✗");
  if (ticket1.success) {
    console.log(`    - ID: ${ticket1.ticket.id}`);
    console.log(`    - Category: ${ticket1.ticket.category} (auto-detected)`);
    console.log(`    - Assigned to: ${ticket1.ticket.assignedTo}`);
    console.log(`    - SLA Due: ${new Date(ticket1.ticket.slaDueAt).toLocaleString()}`);
  }

  // 2. Multi-turn conversation
  console.log("\n💬 CONVERSATION (Multi-turn Chat)");
  console.log("-".repeat(40));
  
  if (ticket1.success) {
    const ticketId = ticket1.ticket.id;
    
    // First reply
    const reply1 = await request("POST", `/api/tickets/${ticketId}/messages`, {
      message: "I've been waiting for 2 hours now. Is there another way to reset?"
    });
    console.log("  Customer reply 1:", reply1.success ? "✓" : "✗");
    if (reply1.success) {
      console.log(`    AI Response: ${reply1.response.substring(0, 80)}...`);
    }

    // Second reply
    const reply2 = await request("POST", `/api/tickets/${ticketId}/messages`, {
      message: "I found the email in a different folder. Thanks for the help!"
    });
    console.log("  Customer reply 2:", reply2.success ? "✓" : "✗");
    if (reply2.success) {
      console.log(`    AI Response: ${reply2.response.substring(0, 80)}...`);
    }

    // Get ticket with full conversation
    const ticketDetails = await request("GET", `/api/tickets/${ticketId}`);
    console.log("  Conversation history:", ticketDetails.success ? `✓ ${ticketDetails.ticket.conversation.length} messages` : "✗");
  }

  // 3. List user's tickets
  console.log("\n📋 USER TICKETS");
  console.log("-".repeat(40));
  
  const myTickets = await request("GET", "/api/tickets");
  console.log("  Get my tickets:", myTickets.success ? `✓ ${myTickets.tickets.length} tickets` : "✗");
  if (myTickets.success && myTickets.tickets.length > 0) {
    myTickets.tickets.forEach(t => {
      console.log(`    - [${t.status}] ${t.subject} (${t.category})`);
    });
  }

  // 4. Dashboard metrics
  console.log("\n📊 DASHBOARD METRICS");
  console.log("-".repeat(40));
  
  const metrics = await request("GET", "/api/dashboard/metrics");
  if (metrics.success) {
    console.log("  Overview:");
    console.log(`    - Total tickets: ${metrics.overview.totalTickets}`);
    console.log(`    - Open: ${metrics.overview.openTickets}`);
    console.log(`    - In Progress: ${metrics.overview.inProgressTickets}`);
    console.log(`    - Resolved: ${metrics.overview.resolvedTickets}`);
    
    console.log("  SLA Status:");
    console.log(`    - Breach rate: ${metrics.sla.breachRate}`);
    console.log(`    - At risk: ${metrics.sla.atRiskCount}`);
    
    console.log("  Response Time:");
    console.log(`    - Average: ${metrics.responseTime.averageFormatted}`);
    
    console.log("  Resolution Time:");
    console.log(`    - Average: ${metrics.resolutionTime.averageFormatted}`);
    console.log(`    - Total resolved: ${metrics.resolutionTime.totalResolved}`);
    
    console.log("  Agent Workloads:");
    metrics.agents.forEach(a => {
      console.log(`    - ${a.name}: ${a.currentLoad}/${a.maxLoad} (${a.utilization})`);
    });
    
    console.log("  Category Distribution:");
    metrics.distribution.byCategory.forEach(c => {
      console.log(`    - ${c.category}: ${c.count}`);
    });
  } else {
    console.log("  ✗", metrics.error);
  }

  // 5. SLA Alerts
  console.log("\n🚨 SLA ALERTS");
  console.log("-".repeat(40));
  
  const alerts = await request("GET", "/api/dashboard/sla-alerts");
  if (alerts.success) {
    console.log(`  Breached: ${alerts.breached.length} tickets`);
    console.log(`  At Risk: ${alerts.atRisk.length} tickets`);
    alerts.atRisk.forEach(t => {
      console.log(`    - ${t.subject} (${t.priority}) - ${t.timeRemaining} remaining`);
    });
  }

  // 6. Close ticket
  console.log("\n✅ CLOSE TICKET");
  console.log("-".repeat(40));
  
  if (ticket1.success) {
    const closeRes = await request("PATCH", `/api/tickets/${ticket1.ticket.id}/status`, {
      status: "resolved"
    });
    console.log("  Mark as resolved:", closeRes.success ? "✓" : "✗");
  }

  console.log("\n" + "=".repeat(60));
  console.log("   TEST COMPLETE");
  console.log("=".repeat(60) + "\n");
}

runFeatureTests().catch(console.error);
