import mongoose from "mongoose";
import { CONFIG } from "../config/index.js";
import { connectDB } from "../config/database.js";
import { User, Agent, Ticket, Customer, AuditLog } from "../models/index.js";

const isProduction = process.env.NODE_ENV === "production";
const force = process.argv.includes("--force") || process.env.SEED_FORCE === "true";

if (isProduction && !force) {
  console.error("✗ Refusing to seed in production without --force or SEED_FORCE=true");
  process.exit(1);
}

// Agents data
const agents = [
  { email: "john@support.com", name: "John Smith", categories: ["technical", "gameplay"], maxLoad: 10 },
  { email: "sarah@support.com", name: "Sarah Johnson", categories: ["billing", "account"], maxLoad: 8 },
  { email: "mike@support.com", name: "Mike Wilson", categories: ["security", "technical"], maxLoad: 12 },
  { email: "alex@support.com", name: "Alex Rivera", categories: ["general"], maxLoad: 6 },
];

// Customers data
const customers = [
  { email: "player1@gmail.com", name: "Alex Turner", plan: "premium" },
  { email: "player2@gmail.com", name: "Emma Davis", plan: "basic" },
  { email: "player3@gmail.com", name: "Chris Brown", plan: "enterprise" },
  { email: "player4@gmail.com", name: "Lisa Wang", plan: "premium" },
  { email: "player5@gmail.com", name: "David Kim", plan: "basic" },
];

// Sample tickets with conversations
const ticketTemplates = [
  {
    subject: "Cannot login to my account",
    description: "I've been trying to login for the past hour but keep getting 'Invalid credentials' error. I'm sure my password is correct.",
    category: "account",
    priority: "high",
    status: "open",
    assigned: true,
    conversation: [
      { role: "customer", content: "I've been trying to login for the past hour but keep getting 'Invalid credentials' error." },
    ],
  },
  {
    subject: "Billing issue - double charged",
    description: "I was charged twice for my monthly subscription. Please refund the extra charge.",
    category: "billing",
    priority: "urgent",
    status: "in-progress",
    assigned: true,
    conversation: [
      { role: "customer", content: "I was charged twice for my monthly subscription. Order #12345" },
      { role: "agent", content: "I apologize for the inconvenience. I can see the duplicate charge. Processing refund now." },
      { role: "customer", content: "Thank you! How long will it take?" },
    ],
  },
  {
    subject: "Game crashes on startup",
    description: "The game crashes immediately after the loading screen. I've tried reinstalling but the issue persists.",
    category: "technical",
    priority: "high",
    status: "open",
    assigned: false,
    conversation: [
      { role: "customer", content: "Game crashes on startup. Windows 11, RTX 3080, 32GB RAM." },
    ],
  },
  {
    subject: "Missing in-game items",
    description: "I purchased the Battle Pass but didn't receive the exclusive items. Transaction ID: TXN-789456",
    category: "gameplay",
    priority: "medium",
    status: "in-progress",
    assigned: true,
    conversation: [
      { role: "customer", content: "Purchased Battle Pass but items are missing. TXN-789456" },
      { role: "agent", content: "I've verified your purchase. The items should appear within 24 hours." },
    ],
  },
  {
    subject: "Account security concern",
    description: "I received an email about a login from an unknown location. Please help secure my account.",
    category: "security",
    priority: "urgent",
    status: "open",
    assigned: true,
    slaOffsetHours: -2,
    conversation: [
      { role: "customer", content: "Someone tried to access my account from Russia. I'm in the US!" },
    ],
  },
  {
    subject: "How to change username",
    description: "I want to change my display name in the game. How can I do this?",
    category: "account",
    priority: "low",
    status: "resolved",
    assigned: true,
    conversation: [
      { role: "customer", content: "How do I change my username?" },
      { role: "agent", content: "Go to Settings > Profile > Edit Display Name. You can change it once every 30 days." },
      { role: "customer", content: "Found it, thanks!" },
    ],
  },
  {
    subject: "Refund request for DLC",
    description: "I accidentally purchased the wrong DLC pack. Can I get a refund?",
    category: "billing",
    priority: "medium",
    status: "open",
    assigned: true,
    conversation: [
      { role: "customer", content: "Bought wrong DLC by mistake. Order #DLC-2024-001" },
    ],
  },
  {
    subject: "Lag spikes during gameplay",
    description: "Experiencing severe lag spikes every few minutes. My internet is fine, tested with other games.",
    category: "technical",
    priority: "medium",
    status: "in-progress",
    assigned: true,
    slaOffsetHours: 2,
    conversation: [
      { role: "customer", content: "Lag spikes every 2-3 minutes. Ping goes from 30ms to 500ms+" },
      { role: "agent", content: "This might be server-related. Which region are you playing on?" },
      { role: "customer", content: "US East server" },
    ],
  },
  {
    subject: "Banned unfairly",
    description: "My account was banned but I never cheated. Please review my case.",
    category: "security",
    priority: "high",
    status: "open",
    assigned: false,
    conversation: [
      { role: "customer", content: "Account banned for 'cheating' but I've never used any hacks!" },
    ],
  },
  {
    subject: "Cannot redeem promo code",
    description: "The promo code SUMMER2024 is not working. It says 'Invalid code'.",
    category: "billing",
    priority: "low",
    status: "resolved",
    assigned: true,
    conversation: [
      { role: "customer", content: "Promo code SUMMER2024 not working" },
      { role: "agent", content: "That code expired on July 31st. Here's a new code: FALL2024 for 15% off." },
      { role: "customer", content: "That worked, thank you!" },
    ],
  },
  {
    subject: "Progress not saving",
    description: "My game progress keeps resetting. Lost 10 hours of gameplay twice now.",
    category: "technical",
    priority: "urgent",
    status: "open",
    assigned: true,
    slaOffsetHours: -5,
    needsManualReview: true,
    conversation: [
      { role: "customer", content: "Lost all my progress AGAIN! This is the second time!" },
      { role: "system", content: "AI response unavailable. This ticket has been marked for manual review by a support agent." },
    ],
  },
  {
    subject: "Two-factor authentication setup",
    description: "I want to enable 2FA on my account but can't find the option.",
    category: "security",
    priority: "low",
    status: "resolved",
    assigned: true,
    conversation: [
      { role: "customer", content: "Where is the 2FA option?" },
      { role: "agent", content: "Go to Account Settings > Security > Enable Two-Factor Authentication" },
      { role: "customer", content: "Got it, enabled now. Thanks!" },
    ],
  },
  {
    subject: "Subscription canceled unexpectedly",
    description: "My subscription shows as canceled, but I did not cancel it. Please check.",
    category: "billing",
    priority: "high",
    status: "closed",
    assigned: true,
    conversation: [
      { role: "customer", content: "Subscription canceled without my action." },
      { role: "agent", content: "We confirmed it was a billing failure. You can resubscribe anytime." },
      { role: "system", content: "Ticket closed by agent" },
    ],
  },
  {
    subject: "Reopened: Issue persists after fix",
    description: "The crash still happens after the suggested fix. Reopening.",
    category: "technical",
    priority: "high",
    status: "in-progress",
    assigned: true,
    reopenCount: 1,
    conversation: [
      { role: "customer", content: "The crash still happens after the fix." },
      { role: "system", content: "Ticket reopened due to customer reply" },
      { role: "agent", content: "Thanks for confirming. Please share the latest logs." },
    ],
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log(`Using database: ${CONFIG.MONGO_URI}\n`);

    // Drop all collections
    console.log("Dropping existing data...");
    await Promise.all([
      User.deleteMany({}),
      Agent.deleteMany({}),
      Ticket.deleteMany({}),
      Customer.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log("✓ All collections cleared\n");

    // Create customers
    console.log("Creating customers...");
    const createdCustomers = await Customer.insertMany(customers);
    console.log(`✓ Created ${createdCustomers.length} customers\n`);

    // Create agents
    console.log("Creating agents...");
    const createdAgents = await Agent.insertMany(agents);
    console.log(`✓ Created ${createdAgents.length} agents\n`);

    // Create users
    console.log("Creating users...");
    
    // Admin user (role stored in database, not hardcoded)
    const adminUser = {
      email: "admin@gmail.com",
      name: "Admin User",
      role: "admin",
    };

    // Agent users (linked to Agent records)
    const agentUsers = createdAgents.map(agent => ({
      email: agent.email,
      name: agent.name,
      role: "agent",
      agentId: agent._id,
    }));

    // Customer users (linked to Customer records)
    const customerUsers = createdCustomers.map(customer => ({
      email: customer.email,
      name: customer.name,
      role: "user",
      customerId: customer._id,
    }));

    await User.insertMany([adminUser, ...agentUsers, ...customerUsers]);
    console.log(`✓ Created ${1 + agentUsers.length + customerUsers.length} users\n`);

    // Create tickets
    console.log("Creating tickets...");
    const SLA_HOURS = { low: 72, medium: 48, high: 24, urgent: 8 };
    
    const now = new Date();
    const HOUR = 60 * 60 * 1000;
    const MIN = 60 * 1000;

    const tickets = ticketTemplates.map((template, index) => {
      const customer = createdCustomers[index % createdCustomers.length];
      const slaHours = SLA_HOURS[template.priority] || 48;
      const assignedAgent = template.assigned === false ? null : createdAgents[index % createdAgents.length];

      let slaDueAt;
      let createdAt;
      if (typeof template.slaOffsetHours === "number") {
        slaDueAt = new Date(now.getTime() + template.slaOffsetHours * HOUR);
        createdAt = new Date(slaDueAt.getTime() - slaHours * HOUR);
      } else {
        createdAt = new Date(now.getTime() - (Math.random() * 7 + 1) * 24 * HOUR);
        slaDueAt = new Date(createdAt.getTime() + slaHours * HOUR);
      }

      const conversation = template.conversation.map((msg, i) => ({
        ...msg,
        timestamp: new Date(createdAt.getTime() + (i + 1) * 15 * MIN),
      }));
      const firstAgentMessage = conversation.find(m => m.role === "agent");
      const firstResponseAt = firstAgentMessage?.timestamp;
      const resolvedAt = ["resolved", "closed"].includes(template.status)
        ? new Date(createdAt.getTime() + Math.min(slaHours - 1, 12) * HOUR)
        : undefined;
      const reopenCount = template.reopenCount || 0;
      const reopenedAt = reopenCount > 0
        ? new Date(now.getTime() - 6 * HOUR)
        : undefined;
      
      const { assigned: _assigned, slaOffsetHours: _slaOffsetHours, ...templateData } = template;

      return {
        ...templateData,
        customerId: customer._id,
        customerEmail: customer.email,
        assignedTo: assignedAgent?._id,
        slaDueAt,
        createdAt,
        conversation,
        slaBreached: slaDueAt < now,
        resolvedAt,
        firstResponseAt,
        needsManualReview: template.needsManualReview || false,
        reopenCount,
        reopenedAt,
      };
    });

    const createdTickets = await Ticket.insertMany(tickets);
    console.log(`✓ Created ${createdTickets.length} tickets\n`);

    // Update agent loads
    console.log("Updating agent loads...");
    for (const agent of createdAgents) {
      const assignedCount = await Ticket.countDocuments({
        assignedTo: agent._id,
        status: { $nin: ["resolved", "closed"] },
      });
      await Agent.findByIdAndUpdate(agent._id, { currentLoad: assignedCount });
    }
    console.log("✓ Agent loads updated\n");

    // Create audit logs
    console.log("Creating audit logs...");
    const auditLogs = [
      { action: "system.startup", category: "system", description: "System initialized", severity: "info" },
      { action: "user.login", category: "user", userEmail: "admin@gmail.com", userName: "Admin User", description: "Admin logged in", severity: "info" },
      { action: "agent.created", category: "agent", userEmail: "admin@gmail.com", description: "Agent John Smith created", targetType: "agent", severity: "info" },
      { action: "ticket.created", category: "ticket", userEmail: "player1@gmail.com", description: "New ticket: Cannot login to my account", severity: "info" },
      { action: "ticket.sla_breached", category: "ticket", description: "SLA breached for ticket: Account security concern", severity: "warning" },
    ];
    await AuditLog.insertMany(auditLogs);
    console.log(`✓ Created ${auditLogs.length} audit logs\n`);

    // Summary
    console.log("=".repeat(50));
    console.log("SEED COMPLETE!");
    console.log("=".repeat(50));
    console.log(`
Customers: ${createdCustomers.length}
Agents: ${createdAgents.length}
Users: ${1 + agentUsers.length + customerUsers.length}
Tickets: ${createdTickets.length}
Audit Logs: ${auditLogs.length}

LOGIN CREDENTIALS (OTP: 123456 in dev mode):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin:    admin@example.com
Agents:   john@support.com, sarah@support.com, mike@support.com
Users:    player1@gmail.com, player2@gmail.com, player3@gmail.com, etc.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTE: User roles are now stored in the database.
      No hardcoded email lists - roles are determined by User.role field.
`);

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
