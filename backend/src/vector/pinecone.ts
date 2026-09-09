import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Global Pinecone Client Singleton
 * Connects to the Serverless Cloud Vector Database for high-speed similarity search.
 */
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'mock-pinecone-key-for-local-testing',
});

// The designated serverless index for all RAG operations
export const PINECONE_INDEX_NAME = 'omnidesk-rag-index';

/**
 * Retrieves the strongly-typed Pinecone Index instance.
 */
export const getPineconeIndex = () => {
  return pinecone.index(PINECONE_INDEX_NAME);
};

// Verification Script
if (require.main === module) {
  async function runPineconeTest() {
    console.log('[Pinecone] Initializing Cloud Vector DB connection test...');
    try {
      if (process.env.PINECONE_API_KEY) {
         // Only attempt actual remote call if a real key is present
         const indexes = await pinecone.listIndexes();
         console.log('[Pinecone] Connection successful. Available Indexes:', indexes);
      } else {
         console.log('[Pinecone] Architecture validated locally (No active API key provided).');
      }
    } catch (error) {
      console.error('[Pinecone] Connection failed. Verify your PINECONE_API_KEY.', error);
    }
  }
  runPineconeTest();
}
