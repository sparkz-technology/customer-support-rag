import "dotenv/config";
import mongoose from "mongoose";
import { CONFIG } from "../config/index.js";
import { Customer, User, Ticket } from "../models/index.js";

const customers = [
  { email: "john@example.com", name: "John Doe", plan: "premium" },
  { email: "jane@example.com", name: "Jane Smith", plan: "enterprise" },
  { email: "bob@example.com", name: "Bob Wilson", plan: "basic" },
];

const tickets = [
  {
    customerEmail: "john@example.com",
    subject: "Login Issue",
    description: "Cannot login to my account after password reset",
    status: "open",
  },
  {
    customerEmail: "jane@example.com",
    subject: "Billing Question",
    description: "Need clarification on last month invoice",
    status: "in-progress",
  },
  {
    customerEmail: "bob@example.com",
    subject: "Feature Request",
    description: "Would like to have dark mode option",
    status: "resolved",
  },
];

async function seed() {
  try {
    await mongoose.connect(CONFIG.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Customer.deleteMany({});
    await User.deleteMany({});
    await Ticket.deleteMany({});
    console.log("Cleared existing data");

    // Seed customers
    const createdCustomers = await Customer.insertMany(customers);
    console.log(`Seeded ${createdCustomers.length} customers`);

    // Create users linked to customers
    const users = createdCustomers.map((c) => ({
      email: c.email,
      customerId: c._id,
    }));
    await User.insertMany(users);
    console.log(`Seeded ${users.length} users`);

    // Seed tickets with customer links
    const ticketsWithIds = tickets.map((t) => {
      const customer = createdCustomers.find((c) => c.email === t.customerEmail);
      return { ...t, customerId: customer?._id };
    });
    await Ticket.insertMany(ticketsWithIds);
    console.log(`Seeded ${ticketsWithIds.length} tickets`);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
