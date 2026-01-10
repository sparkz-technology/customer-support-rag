import { Router } from "express";
import { Document } from "@langchain/core/documents";
import { addDocuments, searchWithScores } from "../services/rag.js";
import { requireAuth } from "../middleware/index.js";
import { uploadText } from "../middleware/upload.js";

const router = Router();

// Upload text file to knowledge base
router.post("/upload", requireAuth, uploadText.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Text file required" });
    }

    const content = req.file.buffer.toString("utf-8");
    const { category, topic } = req.body;

    // Split content into chunks (by paragraphs or fixed size)
    const chunks = splitIntoChunks(content, 1000);

    const docs = chunks.map(
      (chunk, index) =>
        new Document({
          pageContent: chunk,
          metadata: {
            filename: req.file.originalname,
            category: category || "general",
            topic: topic || "support",
            chunkIndex: index,
            totalChunks: chunks.length,
            addedBy: req.user.email,
            addedAt: new Date(),
          },
        })
    );

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

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: "Documents array required" });
    }

    const docs = documents.map(
      (d) =>
        new Document({
          pageContent: d.content,
          metadata: { ...d.metadata, addedBy: req.user.email, addedAt: new Date() },
        })
    );

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

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' required" });
    }

    const results = await searchWithScores(q, parseInt(limit));
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

export default router;
