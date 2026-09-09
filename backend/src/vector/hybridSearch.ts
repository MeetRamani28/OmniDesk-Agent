import { Document } from '@langchain/core/documents';

/**
 * Hybrid Search Engine Core (RRF)
 * Merges Keyword (FTS) and Vector Cosine Similarity using Reciprocal Rank Fusion.
 * This guarantees resilience against exact-keyword mismatches while preserving domain-specific terminology.
 */
export class HybridSearchEngine {
  
  /**
   * Reciprocal Rank Fusion (RRF)
   * Formula: RRF_Score = 1 / (k + rank)
   * Merges two distinct ranked lists into a single superior ranking.
   */
  public performRRF(keywordResults: Document[], vectorResults: Document[], k: number = 60): Document[] {
    const scoreMap = new Map<string, { doc: Document, score: number }>();

    // Process Keyword Results
    keywordResults.forEach((doc, index) => {
      const docId = doc.metadata.id || doc.pageContent; // Fallback to content as deterministic ID for testing
      const rank = index + 1;
      const score = 1 / (k + rank);
      scoreMap.set(docId, { doc, score });
    });

    // Process Vector Results
    vectorResults.forEach((doc, index) => {
      const docId = doc.metadata.id || doc.pageContent;
      const rank = index + 1;
      const score = 1 / (k + rank);
      
      if (scoreMap.has(docId)) {
        scoreMap.get(docId)!.score += score;
      } else {
        scoreMap.set(docId, { doc, score });
      }
    });

    // Sort by combined RRF score descending
    const fusedResults = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.doc);

    return fusedResults;
  }
}

// Verification function
if (require.main === module) {
  console.log('[Hybrid Search] Simulating RRF Fusion...');
  const engine = new HybridSearchEngine();
  
  const d1 = new Document({ pageContent: 'Logistics issue', metadata: { id: '1' } });
  const d2 = new Document({ pageContent: 'Technical error', metadata: { id: '2' } });
  const d3 = new Document({ pageContent: 'Billing failure', metadata: { id: '3' } });

  // Simulate mock search results where D1 dominates keyword, but D3 dominates vector similarity
  const keywordRanking = [d1, d2, d3];
  const vectorRanking = [d3, d1, d2];

  const results = engine.performRRF(keywordRanking, vectorRanking);
  
  console.log('[Hybrid Search] RRF Merged Ranking Algorithm successful:');
  results.forEach((doc, i) => console.log(`  ${i + 1}. ${doc.pageContent}`));
}
