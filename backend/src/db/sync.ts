import { Document } from '@langchain/core/documents';
import { db } from './index';
import { embeddingService } from '../vector/embeddings';
import { getPineconeIndex } from '../vector/pinecone';
import { HierarchicalChunker } from '../vector/chunker';

/**
 * ETL Pipeline: SQLite to Pinecone
 * Automatically extracts structured data from SQLite, chunks it hierarchically, 
 * generates vector embeddings, and synchronizes it with the Pinecone cloud index.
 */
export async function syncKnowledgeToPinecone() {
  console.log('[ETL Pipeline] Initiating SQLite to Pinecone Sync...');

  // 1. Extract from SQLite (Targeting the inventory table for semantic RAG searches)
  const items = db.prepare('SELECT sku, name, price FROM inventory').all() as Array<{ sku: string, name: string, price: number }>;
  
  if (items.length === 0) {
    console.log('[ETL Pipeline] No records found in SQLite to sync.');
    return;
  }

  // 2. Transform (Format and Chunk)
  console.log(`[ETL Pipeline] Extracted ${items.length} records. Chunking...`);
  const rawTextDocs = items.map(item => `Item SKU: ${item.sku}. Name: ${item.name}. Price: $${item.price}.`);
  const combinedText = rawTextDocs.join('\n\n');

  const chunker = new HierarchicalChunker();
  const chunks = await chunker.splitToHierarchicalDocs(combinedText);
  console.log(`[ETL Pipeline] Generated ${chunks.length} hierarchical chunks.`);

  // 3. Environment Guardrail
  if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY.includes('mock')) {
    console.warn('[ETL Pipeline] ABORTED LOAD: No valid PINECONE_API_KEY detected. Extraction and Transformation stages were successful locally.');
    return;
  }

  // 4. Load (Embed and Push to Pinecone)
  console.log('[ETL Pipeline] Generating Embeddings via HF and Pushing to Pinecone...');
  try {
    const pineconeIndex = getPineconeIndex();
    
    // Process in batches to prevent API rate limits and payload size rejections
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const vectors = await Promise.all(batch.map(async (chunk: Document) => {
        const embedding = await embeddingService.embedQuery(chunk.pageContent);
        return {
          id: chunk.metadata.id,
          values: embedding,
          metadata: {
            text: chunk.pageContent,
            type: chunk.metadata.type,
            parent_id: chunk.metadata.parent_id || ''
          }
        };
      }));

      await pineconeIndex.upsert(vectors as any);
      console.log(`[ETL Pipeline] Successfully pushed batch of ${vectors.length} vectors to Pinecone.`);
    }
    
    console.log('[ETL Pipeline] Distributed Synchronization complete!');
  } catch (error) {
    console.error('[ETL Pipeline] CRITICAL ERROR during Pinecone upload:', error);
  }
}

// Architectural Verification Script
if (require.main === module) {
  // Seed the DB if empty so the ETL pipeline has raw data to extract
  db.exec("INSERT OR IGNORE INTO inventory (sku, name, price) VALUES ('SKU-100', 'Enterprise Cloud Server', 999.99)");
  db.exec("INSERT OR IGNORE INTO inventory (sku, name, price) VALUES ('SKU-101', 'Managed PostgreSQL Database', 149.99)");
  
  syncKnowledgeToPinecone().then(() => {
    console.log('[ETL Pipeline] Test execution finished.');
  }).catch(console.error);
}
