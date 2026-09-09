import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import dotenv from 'dotenv';

dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HF_API_KEY) {
  throw new Error('[Embeddings] HUGGINGFACE_API_KEY is completely missing from .env. The system cannot perform RAG retrieval.');
}

/**
 * Enterprise-grade Multilingual Embedding Pipeline
 * Model: sentence-transformers/paraphrase-multilingual-MiniLM-L6-v2
 * Purpose: Supports English, Hinglish, Gujlish semantics seamlessly mapping into a 384-dimensional vector space.
 */
export const embeddingService = new HuggingFaceInferenceEmbeddings({
  apiKey: HF_API_KEY,
  model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L6-v2',
});

// Utility function to test embedding generation locally with actual Hugging Face inference
export async function testEmbeddings() {
  console.log('[Embeddings] Calling Hugging Face API for: "Hello, kem cho? Where is my order?"...');
  try {
    const vector = await embeddingService.embedQuery('Hello, kem cho? Where is my order?');
    console.log(`[Embeddings] Success! Real Vector dimension received: ${vector.length} (Expected: 384)`);
    return vector;
  } catch (error) {
    console.error('[Embeddings] Failed to generate vector. Check your HUGGINGFACE_API_KEY validity or rate limits.', error);
    process.exit(1);
  }
}

// If executed directly via CLI
if (require.main === module) {
  testEmbeddings();
}
