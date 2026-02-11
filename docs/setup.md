# Setup and Environment Guide

This guide covers required environment variables and service setup for local development.

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Pinecone account and index
- Groq API key
- Google AI API key (for embeddings)

## Environment Variables
Create a `.env` file in the project root.

Required:
- PORT
- MONGO_URI
- GROQ_API_KEY
- GOOGLE_API_KEY
- PINECONE_API_KEY
- PINECONE_INDEX
- PINECONE_NAMESPACE

Optional:
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- WEBHOOK_URL
- WEBHOOK_SECRET
- JWT_SECRET
- JWT_REFRESH_SECRET
- JWT_ACCESS_TTL
- JWT_REFRESH_TTL

## Pinecone Index Requirements
- Dimension: 768 (Google `text-embedding-004`)
- Metric: cosine or dot-product
- Namespace: set via `PINECONE_NAMESPACE`

If the index dimension does not match 768, embeddings will fail to upsert.

## Knowledge Base Seeding
1. Ensure `GOOGLE_API_KEY` and Pinecone settings are in `.env`.
2. Run: `node src/scripts/seed-knowledge.js`

This uses sentence-level chunking and stores parent text in metadata for small-to-big retrieval.

## Running Locally
- Backend: `npm run dev`
- Frontend: `cd client && npm run dev`

## Troubleshooting
- "Vector dimension 0" usually means embeddings did not load. Check `GOOGLE_API_KEY` and index dimension.
- Pinecone errors often indicate incorrect index name or missing API key.
