import { JinaEmbeddings } from "@langchain/community/embeddings/jina";
import { PineconeStore } from "@langchain/pinecone";
import { getPineconeIndex } from "../config/pinecone.js";
import { CONFIG } from "../config/index.js";

let vectorStore = null;
const EMBEDDING_DIMENSION = 768; // Jina embeddings-v2-base-en returns 768-dimensional vectors

const getEmbeddings = () => {
  if (!CONFIG.JINA_API_KEY) {
    throw new Error("JINA_API_KEY must be set in .env");
  }
  return new JinaEmbeddings({
    jinaApiKey: CONFIG.JINA_API_KEY,
    model: "jina-embeddings-v2-base-en",
  });
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
    
    // Handle quota exceeded
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      throw new Error("Google API quota exceeded. Please upgrade your API key to paid tier or wait for quota reset.");
    }
    
    // Handle dimension mismatch
    if (err.message?.includes("dimension")) {
      throw new Error(`Vector dimension mismatch. Pinecone index should be ${EMBEDDING_DIMENSION} dimensions. Check your Pinecone index configuration.`);
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
    
    // Handle quota exceeded
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      throw new Error("Google API quota exceeded. Please upgrade your API key to paid tier or wait for quota reset.");
    }
    
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
    
    // Handle quota exceeded
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      throw new Error("Google API quota exceeded. Please upgrade your API key to paid tier or wait for quota reset.");
    }
    
    throw new Error("Knowledge base search failed");
  }
};

// RAG query - get context and format for LLM
export const getRAGContext = async (query, k = 3) => {
  try {
    const results = await searchSimilar(query, k);
    if (results.length === 0) return null;

    const context = results
      .map((doc, i) => `[${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    return context;
  } catch (err) {
    console.error("RAG context error:", err.message);
    return null;
  }
};
