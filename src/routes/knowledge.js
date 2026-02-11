import { Router } from "express";
import crypto from "crypto";
import { Document } from "@langchain/core/documents";
import { addDocuments, searchHybridWithScores } from "../services/rag.js";
import { requireAuth, uploadText } from "../middleware/index.js";
import { schemas } from "../services/validator.js";

const router = Router();

// Upload text file to knowledge base
router.post("/upload", requireAuth, uploadText.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Text file required" });
    }

    const content = req.file.buffer.toString("utf-8");
    const { category, topic } = req.body;
    const validation = schemas.knowledgeUpload({ category, topic });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }

    // Split content into chunks (by paragraphs or fixed size)
    const chunks = splitIntoChunks(content, 1000);
    const addedAt = new Date();

    const docs = chunks.flatMap((chunk, index) => {
      const parentId = buildParentId(chunk, `${req.file.originalname}-${index}`);
      const sentences = splitSentences(chunk);

      return sentences.map(
        (sentence, sentenceIndex) =>
          new Document({
            pageContent: sentence,
            metadata: {
              filename: req.file.originalname,
              category: category || "general",
              topic: topic || "support",
              chunkIndex: index,
              totalChunks: chunks.length,
              addedBy: req.user.email,
              addedAt,
              parentId,
              parentText: chunk,
              sentenceIndex,
            },
          })
      );
    });

    const result = await addDocuments(docs);
    res.json({
      success: true,
      filename: req.file.originalname,
      chunks: chunks.length,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// Add documents to knowledge base (JSON)
router.post("/documents", requireAuth, async (req, res, next) => {
  try {
    const { documents } = req.body;

    const validation = schemas.knowledgeDocuments({ documents });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }

    const addedAt = new Date();
    const docs = documents.flatMap((d, index) => {
      const parentId = buildParentId(d.content, d.metadata?.topic || String(index));
      const sentences = splitSentences(d.content);

      return sentences.map(
        (sentence, sentenceIndex) =>
          new Document({
            pageContent: sentence,
            metadata: {
              ...d.metadata,
              addedBy: req.user.email,
              addedAt,
              parentId,
              parentText: d.content,
              sentenceIndex,
            },
          })
      );
    });

    const result = await addDocuments(docs);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Search knowledge base
router.get("/search", requireAuth, async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    const validation = schemas.knowledgeSearch({ q, limit });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }

    const results = await searchHybridWithScores(q, parseInt(limit));
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

// Helper: Split text into chunks
function splitIntoChunks(text, maxChunkSize = 1000) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length ? chunks : [text];
}

function splitSentences(text) {
  if (!text) return [];
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function buildParentId(content, suffix) {
  const hash = crypto.createHash("sha256");
  hash.update(content || "");
  hash.update(suffix || "");
  return hash.digest("hex").slice(0, 16);
}

export default router;
