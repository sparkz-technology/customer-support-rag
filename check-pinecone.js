import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function checkPineconeIndex() {
  try {
    console.log("\n=== Pinecone Index Configuration Check ===\n");

    const indexName = process.env.PINECONE_INDEX || "auto-triager";
    console.log(`Checking index: ${indexName}`);

    // List all indexes
    const indexes = await pc.listIndexes();
    console.log(`\nAvailable indexes: ${indexes.indexes?.map(i => i.name).join(", ") || "None"}`);

    // Check specific index
    const index = pc.index(indexName);
    const indexStats = await index.describeIndexStats();
    
    console.log(`\nIndex Details:`);
    console.log(`  Name: ${indexName}`);
    console.log(`  Vectors: ${indexStats.totalVectorCount || 0}`);
    console.log(`  Dimension: Check Pinecone dashboard`);
    console.log(`  Namespace: ${process.env.PINECONE_NAMESPACE || "support-docs"}`);

    console.log("\n⚠️  IMPORTANT:");
    console.log("  - Google embedding-001 returns 768-dimensional vectors");
    console.log("  - Your Pinecone index must be configured for 768 dimensions");
    console.log("  - If your index has 1024 dimensions, you need to recreate it");

    console.log("\n📋 To fix dimension mismatch:");
    console.log("  1. Go to https://www.pinecone.io/ (Pinecone Dashboard)");
    console.log("  2. Delete the '" + indexName + "' index");
    console.log("  3. Create new index with:");
    console.log("     - Name: " + indexName);
    console.log("     - Dimensions: 768");
    console.log("     - Metric: cosine");
    console.log("  4. Restart the server");
    console.log("  5. Run: npm run test:api\n");

  } catch (error) {
    console.error("Error checking Pinecone:", error.message);
    console.log("\n❌ Could not connect to Pinecone. Check your PINECONE_API_KEY\n");
  }
}

checkPineconeIndex();
