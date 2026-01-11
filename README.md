# Customer Support RAG

An AI-powered customer support system using Retrieval-Augmented Generation (RAG) to intelligently triage and resolve support tickets. The system combines MongoDB for ticket management, Pinecone for vector similarity search, and Google Gemini for autonomous agent decision-making.

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
- **LLM**: Google Gemini (gemini-2.0-flash)
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Express Rate Limit

## Prerequisites

- Node.js 18+
- MongoDB Atlas or local MongoDB instance
- Pinecone API key and index
- Google API key (for Gemini)
- Gmail account with app password (for OTP emails)

## Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd customer-support-rag
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example environment file and update with your credentials:
```bash
cp .env.example .env
```

Then edit `.env` and set the following required variables:
- `MONGO_URI` - Your MongoDB connection string
- `GOOGLE_API_KEY` - Google AI API key from https://ai.google.dev/
- `PINECONE_API_KEY` - Pinecone API key
- `SMTP_USER` and `SMTP_PASS` - Email credentials for OTP delivery

**Important**: Make sure to URL-encode special characters in your MongoDB password (e.g., `@` becomes `%40`, `#` becomes `%23`).

### 4. Start the application

#### Development Mode
```bash
npm run dev
```
The application will start with hot-reload enabled.

#### Production Mode
```bash
npm start
```

The server starts on the configured PORT (default: 3000).

**Note**: In development mode, if MongoDB is unavailable, the server will still start but database-dependent features will not work until the connection is established.

## Environment Variables

- `GOOGLE_API_KEY`: Required for Gemini chat (gemini-2.0-flash) and embeddings (embedding-001). Get a free key at https://ai.google.dev/
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_NAMESPACE`: Required for vector store.
- `MONGO_URI`: MongoDB connection string.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email settings (production).
- `PORT`: Server port.

## API Endpoints

### Authentication

> Development: When NODE_ENV is not production, the OTP is fixed to 123456 and emails are logged to the console instead of being sent.

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
- Vector search requires Pinecone and Google Gemini setup
- Email sending requires valid SMTP credentials
- No built-in request authentication for test environment

## Troubleshooting

### MongoDB Connection Error
- **DNS Resolution Issues**: If you see `querySrv EREFUSED` errors, this indicates a DNS lookup problem. This can occur if:
  - The MongoDB cluster hostname is incorrect
  - Network access rules in MongoDB Atlas are blocking your IP
  - Your network/firewall is blocking MongoDB connections
- **In Development Mode**: The application will start even if MongoDB is unavailable, but database-dependent features won't work
- **Solution**: 
  - Verify `MONGO_URI` is correct
  - Whitelist your IP in MongoDB Atlas Network Access settings
  - Check credentials do not contain unencoded special characters (use URL encoding, e.g., `@` → `%40`)
  - Test connection using MongoDB Compass or `mongosh` first

### Pinecone/Gemini Errors
- Ensure `PINECONE_API_KEY`, `GOOGLE_API_KEY` are valid
- Verify Pinecone index exists and namespace is correct

### Email Not Sending
- Use Gmail app password, not account password
- Enable "Less Secure App" setting if required
- Verify `SMTP_USER` and `SMTP_PASS` are correct

### Vector Store Initialization
- Must have valid Google API key set
- Pinecone index must exist before first vector operation

## Updates

- **Enhanced AI Capabilities** – Improved decision-making processes for the AI agent.
- **User Experience Improvements** – Streamlined ticket submission and tracking interface.
- **Performance Optimizations** – Reduced response times and improved system efficiency.
- **New Analytics Dashboard** – Added visualizations for better insights into support metrics.

## License

ISC
