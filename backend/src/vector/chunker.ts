import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import crypto from 'crypto';

/**
 * Parent-Child Chunking Engine
 * Creates large parent chunks for context preservation and smaller child chunks for precise vector retrieval.
 * This ensures that when a highly-specific small chunk matches the user's intent, the LLM is fed the larger parent context.
 */
export class HierarchicalChunker {
  private parentSplitter: RecursiveCharacterTextSplitter;
  private childSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // Large context blocks
    this.parentSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 0,
    });

    // Highly precise retrieval blocks
    this.childSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });
  }

  public async splitToHierarchicalDocs(text: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    const parentDocs = await this.parentSplitter.createDocuments([text]);
    const hierarchicalDocs: Document[] = [];

    for (const parent of parentDocs) {
      const parentId = crypto.randomUUID();
      parent.metadata = { ...metadata, doc_id: parentId, type: 'parent' };
      
      const childDocs = await this.childSplitter.createDocuments([parent.pageContent]);
      for (const child of childDocs) {
        child.metadata = { ...metadata, parent_id: parentId, type: 'child' };
        hierarchicalDocs.push(child);
      }
      
      // Store parent separately so it can be retrieved when a child hits
      hierarchicalDocs.push(parent); 
    }

    return hierarchicalDocs;
  }
}

// Verification function
if (require.main === module) {
  async function runTest() {
    const chunker = new HierarchicalChunker();
    const testText = `OmniDesk-Agent is an ultra-advanced customer support operations platform. It leverages a LangGraph.js multi-agent swarm architecture to autonomously resolve complex logistics, technical support, and billing inquiries. This system represents a paradigm shift from traditional procedural chatbots to a fully autonomous, fault-tolerant Agentic AI ecosystem capable of profound reasoning, policy-compliant micro-actions, and dynamic state management.`;
    
    console.log('[Chunker] Executing Parent-Child hierarchical split...');
    const docs = await chunker.splitToHierarchicalDocs(testText);
    
    console.log(`[Chunker] Processed ${docs.length} hierarchical documents successfully.`);
    docs.forEach(d => {
      console.log(`  - Type: [${d.metadata.type}] | Length: ${d.pageContent.length} chars`);
    });
  }
  runTest();
}
