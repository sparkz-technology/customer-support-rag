# AI-Powered Customer Support System

An intelligent customer support backend with RAG (Retrieval Augmented Generation), AI-powered ticket triage, auto-assignment, multi-turn conversations, and real-time analytics.

## 🚀 Features

### Core Features
- **AI Agent with Tool Calling** - LangChain + Groq (Llama 3.3 70B) for intelligent responses
- **RAG System** - Pinecone vector store + Google Gemini embeddings for context-aware answers
- **Smart Ticket Routing** - Auto-categorization and agent assignment based on issue type
- **Multi-turn Conversations** - Full conversation history with AI-powered responses
- **SLA Management** - Automatic SLA tracking with breach alerts
- **Real-time Webhooks** - Event-driven notifications for ticket lifecycle

## 📘 Documentation
- How it works: docs/how-it-works.md
- Setup guide: docs/setup.md

### Authentication & Security
- OTP-based email authentication
- Session token management
- Rate limiting (API & Auth endpoints)
- Helmet security headers

### Analytics Dashboard
- Ticket distribution by status, priority, category
- Response time & resolution time metrics
- Agent workload monitoring
- SLA breach rate tracking
- Trend analysis (7-day ticket volume)

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| Vector Store | Pinecone |
| LLM | Groq (Llama 3.3 70B) |
| Embeddings | Google Gemini (text-embedding-004) |
| AI Framework | LangChain |
| Email | Nodemailer |

## 📁 Project Structure

```
├── src/
│   ├── config/          # Configuration (DB, Pinecone, env)
│   ├── middleware/      # Auth, rate limiting, error handling
│   ├── models/          # MongoDB schemas (Customer, User, Ticket, Agent)
│   ├── routes/          # API endpoints
│   │   ├── auth.js      # OTP authentication
│   │   ├── tickets.js   # Ticket CRUD + conversations
│   │   ├── triage.js    # AI triage endpoint
│   │   ├── knowledge.js # Knowledge base management
│   │   ├── dashboard.js # Analytics & metrics
│   │   └── webhooks.js  # Webhook receiver
│   ├── services/        # Business logic
│   │   ├── agent.js     # AI agent with tools
│   │   ├── rag.js       # Vector search
│   │   ├── ticketAssignment.js # Auto-routing
│   │   ├── email.js     # Notifications
│   │   └── webhooks.js  # Event dispatcher
│   └── scripts/         # Seed scripts
├── docs/                # Knowledge base documents
└── test-*.js            # Test scripts
```

## 🔧 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Pinecone account (free tier works)
- Groq API key (free)
- Google AI API key (free)

### Setup

1. **Clone and install**
```bash
git clone <repo-url>
cd customer-support-rag
npm install --legacy-peer-deps
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Required environment variables**
```env
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/support

# AI Services
GROQ_API_KEY=gsk_...          # Get from console.groq.com
GOOGLE_API_KEY=AIza...        # Get from ai.google.dev

# Vector Store
PINECONE_API_KEY=pcsk_...     # Get from pinecone.io
PINECONE_INDEX=auto-triager
PINECONE_NAMESPACE=support-docs

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Webhooks
WEBHOOK_URL=http://localhost:3000/api/webhooks/ticket-events
```

4. **Seed database**
```bash
npm run seed              # Seed customers, agents, sample tickets
npm run seed:knowledge    # Seed knowledge base documents
```

5. **Start server**
```bash
npm start     # Production
npm run dev   # Development (auto-reload)
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP, get session token |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Create ticket (auto-assigns agent) |
| GET | `/api/tickets` | List user's tickets |
| GET | `/api/tickets/:id` | Get ticket with conversation |
| POST | `/api/tickets/:id/messages` | Add message (multi-turn chat) |
| PATCH | `/api/tickets/:id/status` | Update ticket status |

### AI Triage
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/triage` | AI-powered issue triage |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/knowledge/documents` | Add documents (JSON) |
| POST | `/api/knowledge/upload` | Upload file (.txt, .md, .csv) |
| GET | `/api/knowledge/search` | Search knowledge base |

### Dashboard & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/metrics` | Full dashboard metrics |
| GET | `/api/dashboard/sla-alerts` | SLA breach alerts |
| GET | `/api/analytics` | Basic analytics |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/ticket-events` | Receive ticket events |

## 🧪 Testing

```bash
# Basic API flow test
node test-api.js

# Full feature test (tickets, conversations, dashboard)
node test-features.js
```

## 🎯 Key Features Explained

### Auto-Assignment System
Tickets are automatically categorized and assigned to specialized agents:
- **Account issues** → Account specialists
- **Billing issues** → Billing team
- **Technical issues** → Tech support
- **Gameplay issues** → Game support

Category detection uses keyword matching on ticket description.

### Multi-turn Conversations
Each ticket maintains a full conversation history:
```javascript
{
  conversation: [
    { role: "customer", content: "...", timestamp: "..." },
    { role: "agent", content: "...", timestamp: "..." },
    { role: "system", content: "Ticket assigned to...", timestamp: "..." }
  ]
}
```

### SLA Management
- Automatic SLA calculation based on priority
- Real-time breach detection
- At-risk ticket alerts (due within 4 hours)

| Priority | SLA |
|----------|-----|
| Urgent | 8 hours |
| High | 24 hours |
| Medium | 48 hours |
| Low | 72 hours |

### AI Agent Tools
The AI agent has access to:
1. `get_customer_profile` - Lookup customer data
2. `manage_mongodb_ticket` - Create/update tickets
3. `search_knowledge_base` - RAG search

### Email Notifications
Automatic emails sent for:
- Ticket created
- Agent assigned
- New reply
- Ticket resolved
- SLA breach alerts

## 📊 Dashboard Metrics

The dashboard provides:
- **Overview**: Total, open, in-progress, resolved tickets
- **SLA**: Breach rate, at-risk count
- **Response Time**: Average first response time
- **Resolution Time**: Average time to resolve
- **Distribution**: By status, priority, category
- **Trends**: 7-day ticket volume
- **Agent Workloads**: Current load vs capacity

## 🔒 Security Features

- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/15min API, 5 req/15min auth)
- Session token authentication
- Input validation with Zod

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request
