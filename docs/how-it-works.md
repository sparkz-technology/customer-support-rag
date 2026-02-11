# How This Application Works

This app is an AI-powered customer support system with a Node/Express backend, a React admin/agent portal, and a RAG pipeline for knowledge-based answers.

## High-Level Architecture
- Backend API (Node.js + Express): ticketing, auth, AI services, analytics, webhooks
- Database (MongoDB): tickets, users, agents, customers, audit logs
- Vector store (Pinecone): knowledge base embeddings and retrieval
- LLM (Groq Llama 3.3): agent responses, tool calling, and validation checks
- Frontend (React + Vite + Ant Design): user, agent, and admin dashboards

## Core Flows

### 1) Authentication
- Users request an OTP and verify it to receive a session token.
- Auth middleware protects API routes and uses role-based checks for agent/admin routes.

### 2) Ticket Lifecycle
- Customers create tickets via API.
- The system categorizes and assigns tickets to agents.
- Agents reply to customers, update status/priority/category, and track SLA.
- Tickets store a full conversation history.

### 3) AI Triage and RAG
- The AI agent answers questions using RAG context from the knowledge base.
- Retrieval pipeline:
  - Hybrid search (dense + sparse) in Pinecone
  - LLM reranks top results
  - Small-to-big context: sentence chunks are indexed, but parent text is returned
- The agent builds a final response using the top context snippets.

### 4) A2A Ticket Fixing
- The A2A assistant analyzes a ticket and proposes updates.
- It uses tool calls (priority/category/status updates and knowledge search) instead of hardcoded rules.
- A structured JSON result is returned with:
  - suggestedResponse
  - proposedUpdates
  - notes

### 5) Validation and Guardrails
- Responses are checked for:
  - blocked content
  - quality and length
  - low-confidence language
  - escalation signals
- A lightweight critic model verifies groundedness against retrieved context.
- If validation fails, the agent rewrites the response using the context only.

## Frontend Behavior
- React app uses role-based routes (user, agent, admin).
- Agent UI includes ticket conversation view, SLA indicators, and A2A Assist.
- An error boundary wraps the app to recover from runtime UI errors.

## Key Backend Modules
- src/services/agent.js: main LLM agent logic + tools
- src/services/rag.js: RAG pipeline (hybrid search, rerank, context assembly)
- src/services/ai-validator.js: validation and critic checks
- src/services/a2a/a2a.service.js: agent-to-agent orchestration
- src/routes/*: public API endpoints

## Data Stores
- MongoDB collections: Ticket, User, Agent, Customer, AuditLog
- Pinecone index: sentence-level embeddings with parent text metadata

## What to Run
- Backend: npm run dev
- Frontend: cd client && npm run dev
- Seed KB: node src/scripts/seed-knowledge.js

## API Entry Points (Common)
- POST /api/auth/send-otp
- POST /api/auth/verify-otp
- POST /api/tickets
- GET /api/tickets/:id
- POST /api/tickets/:id/messages
- POST /api/triage
- GET /api/knowledge/search
- GET /api/dashboard/metrics

## Notes
- The RAG pipeline and A2A assistant are designed for production-grade retrieval and structured tool use.
- Add tracing (LangSmith/Phoenix) for full observability in multi-step agent runs.
