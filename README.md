# Customer Support RAG

An AI-powered customer support system using Retrieval-Augmented Generation (RAG) to intelligently triage and resolve support tickets. The system combines MongoDB for ticket management, Pinecone for vector similarity search, and Groq LLM for autonomous agent decision-making.

## Features

- **OTP-based Authentication** – Secure customer login via email verification
- **AI Agent Triage** – Automatic ticket classification and resolution recommendations
- **SLA & Priority Tracking** – Priority-based SLA due times with breach flags
- **Knowledge Base Search** – RAG-powered documentation retrieval with similarity scoring
- **Ticket Management** – Create, update, and track support tickets in MongoDB
- **Webhooks & Alerts** – Generic webhook on ticket create/update
- **Analytics** – Volume, resolution time, deflection rate, and top intents
- **Secure API** – Rate limiting, helmet security headers, and session tokens

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2+
- **Database**: MongoDB (Mongoose)
- **Vector DB**: Pinecone + OpenAI Embeddings
- **LLM**: Groq (llama-3.3-70b-versatile)
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Express Rate Limit

## Prerequisites

- Node.js 18+
- MongoDB Atlas or local MongoDB instance
- Pinecone API key and index
- OpenAI API key (for embeddings)
- Groq API key
- Gmail account with app password (for OTP emails)

## Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file** from template:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** in `.env`:

   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # MongoDB
   MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority

   # OpenAI (embeddings)
   OPENAI_API_KEY=sk-proj-xxxxx

   # Groq (LLM)
   GROQ_API_KEY=gsk_xxxxx

   # Pinecone (vector DB)
   PINECONE_API_KEY=xxxxx
   PINECONE_INDEX=auto-triager
   PINECONE_NAMESPACE=support-docs

   # Email (Gmail)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

  # Webhook (optional)
  WEBHOOK_URL=https://example.com/webhook
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server starts on the configured PORT (default: 3000).

## API Endpoints

### Authentication

**Request OTP:**
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Verify OTP:**
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "sessionToken": "hex_encoded_token"
}
```

### Knowledge Base

**Upload Knowledge File:**
```bash
POST /api/knowledge/upload
Headers: x-session-token: <TOKEN>
Content-Type: multipart/form-data

Body:
- file: gaming-support.txt (text, markdown, or CSV)
- category: gaming (optional)
- topic: faq (optional)
```

**Add Documents (JSON):**
```bash
POST /api/knowledge/documents
Headers: x-session-token: <TOKEN>
Content-Type: application/json

{
  "documents": [
    {
      "content": "How to reset password...",
      "metadata": { "category": "account", "topic": "help" }
    }
  ]
}
```

**Search Knowledge Base:**
```bash
GET /api/knowledge/search?q=account+reset&limit=5
Headers: x-session-token: <TOKEN>

Response:
{
  "success": true,
  "results": [
    {
      "content": "...",
      "metadata": { ... },
      "score": 0.92
    }
  ]
}
```

### Ticket Triage

**Submit Ticket for AI Triage:**
```bash
POST /api/triage
Headers: x-session-token: <TOKEN>
Content-Type: application/json

{
  "ticketId": "optional_existing_id",
  "description": "I can't log into my account"
}

Response:
{
  "success": true,
  "response": "AI agent response..."
}

### Analytics

**Get summary metrics:**
```bash
GET /api/analytics
Headers: x-session-token: <TOKEN>
```

Response fields:
- `totals.byStatus` / `totals.byPriority`
- `metrics.averageResolutionHours`
- `metrics.deflectionRate`
- `topIntents` (by subject)
```

## Database Schema

### Customer
- `email`: String (unique)
- `name`: String
- `plan`: String (basic|premium|enterprise)
- `metadata`: Object

### User
- `email`: String (unique)
- `customerId`: ObjectId (ref: Customer)
- `sessionToken`: String
- `otp`: String
- `otpExpires`: Date
- `lastSeen`: Date

### Ticket
- `customerId`: ObjectId (ref: Customer)
- `customerEmail`: String
- `subject`: String
- `description`: String
- `status`: String (open|in-progress|resolved)
- `agentLogs`: [String]
- `createdAt`: Date

## Seeding Knowledge Base

Seed initial knowledge documents:
```bash
npm run seed:knowledge
```

This loads documents from `docs/` directory into Pinecone.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with auto-reload |
| `npm run seed` | Seed database with initial data |
| `npm run seed:knowledge` | Populate knowledge base from docs |
| `npm test` | Run tests (not implemented) |

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Error message",
  "stack": "... (development only)"
}
```

HTTP status codes:
- `400`: Bad Request (validation failed)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (session invalid)
- `404`: Not Found
- `500`: Server Error

## Security

- **Rate Limiting**: 100 requests/15min per IP (general), 5 attempts/15min (auth)
- **CORS**: Enabled with default origin
- **Security Headers**: Helmet protection against common vulnerabilities
- **Session Tokens**: Crypto-generated 64-character hex strings
- **Input Validation**: Email regex, file type checking

## Known Limitations

- File upload limited to 5MB
- Vector search requires Pinecone and OpenAI API setup
- Email sending requires valid SMTP credentials
- No built-in request authentication for test environment

## Troubleshooting

### MongoDB Connection Error
- Verify `MONGO_URI` is correct and cluster IP is whitelisted
- Check credentials do not contain special characters (URL-encode if needed)

### Pinecone/OpenAI Errors
- Ensure `PINECONE_API_KEY` and `OPENAI_API_KEY` are valid
- Verify Pinecone index exists and namespace is correct

### Email Not Sending
- Use Gmail app password, not account password
- Enable "Less Secure App" setting if required
- Verify `SMTP_USER` and `SMTP_PASS` are correct

### Vector Store Initialization
- Must have valid OpenAI API key set
- Pinecone index must exist before first vector operation

## License

ISC
