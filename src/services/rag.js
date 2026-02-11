import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { ChatGroq } from "@langchain/groq";
import { getPineconeIndex } from "../config/pinecone.js";
import { CONFIG } from "../config/index.js";

let vectorStore = null;
const EMBEDDING_DIMENSION = 768; // Google text-embedding-004 returns 768-dimensional vectors
const DEFAULT_FETCH_K = 10;
const DEFAULT_TOP_K = 5;
const SPARSE_DIMENSION = 50000;
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "he", "in", "is", "it", "its", "of", "on", "or", "that",
  "the", "to", "was", "were", "will", "with", "you", "your",
]);

const getEmbeddings = () => {
  if (!CONFIG.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY must be set in .env");
  }
  return new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: CONFIG.GOOGLE_API_KEY,
  });
};

const estimateTokenCount = (text) => Math.ceil((text || "").length / 4);

const normalizeText = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hashToken = (token) => {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % SPARSE_DIMENSION;
};

const buildSparseVector = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return { indices: [], values: [] };

  const tokens = normalized.split(" ").filter((t) => t && !STOPWORDS.has(t));
  const counts = new Map();
  tokens.forEach((token) => {
    const idx = hashToken(token);
    counts.set(idx, (counts.get(idx) || 0) + 1);
  });

  const indices = [];
  const values = [];
  for (const [idx, count] of counts.entries()) {
    indices.push(idx);
    values.push(1 + Math.log(count));
  }

  return { indices, values };
};

const getContentFromMetadata = (metadata) =>
  metadata?.text || metadata?.pageContent || metadata?.content || "";

const getContextFromResult = (result) => {
  if (result.metadata?.parentText) {
    return result.metadata.parentText;
  }
  return result.content;
};

const rerankResults = async (query, results, topK) => {
  if (!CONFIG.GROQ_API_KEY || results.length === 0) return results.slice(0, topK);

  const model = new ChatGroq({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    apiKey: CONFIG.GROQ_API_KEY,
    maxTokens: 512,
  });

  const payload = results.map((item, index) => ({
    id: index + 1,
    snippet: item.content.slice(0, 800),
  }));

  const systemPrompt = "You are a reranking model. Score each snippet for relevance to the query. Return strict JSON: {scores:[{id:number, score:number}]}. Scores must be 0 to 1.";
  const userPrompt = `Query: ${query}\n\nSnippets:\n${JSON.stringify(payload, null, 2)}`;

  try {
    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const jsonStart = response.content.indexOf("{");
    const jsonEnd = response.content.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return results.slice(0, topK);
    }

    const parsed = JSON.parse(response.content.slice(jsonStart, jsonEnd + 1));
    const scoreMap = new Map(
      (parsed.scores || []).map((item) => [item.id, item.score])
    );

    const rescored = results
      .map((item, index) => ({
        ...item,
        rerankScore: scoreMap.get(index + 1) ?? item.score ?? 0,
      }))
      .sort((a, b) => b.rerankScore - a.rerankScore);

    return rescored.slice(0, topK);
  } catch (err) {
    console.warn("Rerank failed, falling back to vector scores:", err.message);
    return results.slice(0, topK);
  }
};

export const getVectorStore = async () => {
  if (!vectorStore) {
    try {
      const pineconeIndex = getPineconeIndex();
      vectorStore = await PineconeStore.fromExistingIndex(getEmbeddings(), {
        pineconeIndex,
        namespace: CONFIG.PINECONE_NAMESPACE,
      });
    } catch (err) {
      console.error("Vector store init error:", err.message);
      throw new Error("Failed to initialize vector store");
    }
  }
  return vectorStore;
};

// Add documents to vector store
export const addDocuments = async (documents) => {
  try {
    const store = await getVectorStore();
    await store.addDocuments(documents);
    return { success: true, count: documents.length };
  } catch (err) {
    console.error("Document add error:", err.message);
    
    // Handle dimension mismatch
    if (err.message?.includes("dimension")) {
      throw new Error(`Vector dimension mismatch. Pinecone index should be ${EMBEDDING_DIMENSION} dimensions.`);
    }
    
    throw new Error("Failed to add documents to knowledge base");
  }
};

// Search similar documents
export const searchSimilar = async (query, k = 5) => {
  try {
    const store = await getVectorStore();
    const results = await store.similaritySearch(query, k);
    return results;
  } catch (err) {
    console.error("Search error:", err.message);
    throw new Error("Knowledge base search failed");
  }
};

// Search with scores
export const searchWithScores = async (query, k = 5) => {
  try {
    const store = await getVectorStore();
    const results = await store.similaritySearchWithScore(query, k);
    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score,
    }));
  } catch (err) {
    console.error("Search with scores error:", err.message);
    throw new Error("Knowledge base search failed");
  }
};

export const searchHybridWithScores = async (query, k = DEFAULT_FETCH_K) => {
  try {
    const pineconeIndex = getPineconeIndex();
    const embeddings = getEmbeddings();
    const denseVector = await embeddings.embedQuery(query);
    const sparseVector = buildSparseVector(query);

    const response = await pineconeIndex.query({
      topK: k,
      vector: denseVector,
      sparseVector,
      includeMetadata: true,
      namespace: CONFIG.PINECONE_NAMESPACE,
    });

    return (response.matches || []).map((match) => ({
      content: getContentFromMetadata(match.metadata),
      metadata: match.metadata || {},
      score: match.score || 0,
    }));
  } catch (err) {
    console.error("Hybrid search error:", err.message);
    throw new Error("Knowledge base search failed");
  }
};

// RAG query - get context and format for LLM
export const getRAGBundle = async (query, options = {}) => {
  try {
    const opts = typeof options === "number" ? { topK: options } : options;
    const fetchK = opts.fetchK || DEFAULT_FETCH_K;
    const topK = opts.topK || DEFAULT_TOP_K;
    const useHybrid = opts.useHybrid !== false;
    const useRerank = opts.useRerank !== false;

    const rawResults = useHybrid
      ? await searchHybridWithScores(query, fetchK)
      : await searchWithScores(query, fetchK);

    if (rawResults.length === 0) return null;

    const reranked = useRerank
      ? await rerankResults(query, rawResults, topK)
      : rawResults.slice(0, topK);

    const seenParents = new Set();
    const finalResults = [];
    for (const item of reranked) {
      const parentKey = item.metadata?.parentId || item.content;
      if (seenParents.has(parentKey)) continue;
      seenParents.add(parentKey);
      finalResults.push(item);
      if (finalResults.length >= topK) break;
    }

    const context = finalResults
      .map((doc, i) => `[${i + 1}] ${getContextFromResult(doc)}`)
      .join("\n\n");

    return {
      context,
      sources: finalResults,
      estimatedTokens: estimateTokenCount(context),
    };
  } catch (err) {
    console.error("RAG bundle error:", err.message);
    return null;
  }
};

export const getRAGContext = async (query, options = {}) => {
  const bundle = await getRAGBundle(query, options);
  return bundle?.context || null;
};
