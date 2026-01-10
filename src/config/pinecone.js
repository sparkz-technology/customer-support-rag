import { Pinecone } from "@pinecone-database/pinecone";
import { CONFIG } from "./index.js";

let pineconeClient = null;

export const getPinecone = () => {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: CONFIG.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
};

export const getPineconeIndex = () => {
  const pc = getPinecone();
  return pc.index(CONFIG.PINECONE_INDEX);
};
