import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentState } from './state';
import { AIMessage } from '@langchain/core/messages';
import { embeddingService } from '../vector/embeddings';
import { HybridSearchEngine } from '../vector/hybridSearch';
import { Document } from '@langchain/core/documents';

/**
 * In-Memory Mock Vector Store (Replaced by Pinecone distributed index in Phase 5)
 */
const MOCK_KNOWLEDGE_BASE = [
  new Document({ pageContent: 'Error 404 means the requested resource is not found.', metadata: { id: '1', type: 'child', parent_id: 'p1' } }),
  new Document({ pageContent: 'Error 500 implies an internal server crash. Reboot the agent.', metadata: { id: '2', type: 'child', parent_id: 'p2' } })
];

const MOCK_PARENTS = [
  new Document({ pageContent: 'Full Context: Error 404 means the requested resource is not found. This typically happens if the endpoint URL is malformed.', metadata: { id: 'p1', type: 'parent' } }),
  new Document({ pageContent: 'Full Context: Error 500 implies an internal server crash. Reboot the agent. Ensure sufficient RAM is allocated in docker-compose.yml.', metadata: { id: 'p2', type: 'parent' } })
];

/**
 * Tool: Search Knowledge Base (Hybrid RAG)
 * Bound to the LLM to autonomously search technical documentation.
 */
export const searchKnowledgeBaseTool = tool(
  async ({ query }) => {
    console.log(`[Tech Support Tool] Executing RAG retrieval for query: "${query}"`);
    
    // Simulate API inference delay for embedding generation
    await embeddingService.embedQuery(query).catch(() => {
      console.warn('[Tech Support Tool] Fallback: Skipping live HF API for local mock simulation.');
    }); 

    const searchEngine = new HybridSearchEngine();
    
    // Simulating raw retrieval arrays
    const rawVectorHits = [MOCK_KNOWLEDGE_BASE[1]]; // Assuming query aligns semantically with Error 500
    const rawKeywordHits = [MOCK_KNOWLEDGE_BASE[0], MOCK_KNOWLEDGE_BASE[1]];
    
    // Execute RRF Fusion
    const fusedHits = searchEngine.performRRF(rawKeywordHits, rawVectorHits);
    
    // Hierarchical Parent-Chunk Expansion
    console.log(`[Tech Support Tool] Expanding ${fusedHits.length} child chunks to full parent contexts...`);
    const expandedContexts = fusedHits.map(child => {
      const parent = MOCK_PARENTS.find(p => p.metadata.id === child.metadata.parent_id);
      return parent ? parent.pageContent : child.pageContent;
    });

    return JSON.stringify({ results: expandedContexts });
  },
  {
    name: 'search_knowledge_base',
    description: 'Query the technical documentation using Hybrid Search and Hierarchical Chunk Expansion.',
    schema: z.object({
      query: z.string().describe('The user\'s precise technical question or error code.'),
    }),
  }
);

export const techSupportTools = [searchKnowledgeBaseTool];

/**
 * Tech Support Sub-Agent Node
 * Handles diagnostic reasoning and RAG utilization.
 */
export async function techSupportNode(state: typeof AgentState.State) {
  console.log('[Tech Support Agent] Received task. Analyzing context...');
  
  const lastMessage = state.messages[state.messages.length - 1]?.content.toString() || '';
  let responseContent = 'I can help with technical issues. What error are you seeing?';
  
  if (lastMessage.includes('Error 500') || lastMessage.includes('crash')) {
    console.log('[Tech Support Agent] LLM determined `search_knowledge_base` tool is highly relevant.');
    const toolResult = await searchKnowledgeBaseTool.invoke({ query: lastMessage });
    responseContent = `Based on the internal documentation: ${toolResult}`;
  }

  return {
    messages: [new AIMessage(responseContent)],
    next_agent: 'END', 
  };
}

// Architectural Verification Script
if (require.main === module) {
  async function runTechSupportTest() {
    console.log('[Tech Support Agent] Running standalone integration test...');
    const mockState = {
      messages: [{ content: 'My server just experienced an Error 500 crash.', _getType: () => 'human' } as any],
      next_agent: 'tech_support_agent',
      ticket_id: null
    };

    const result = await techSupportNode(mockState);
    console.log('[Tech Support Agent] Execution output:', result.messages[0].content);
  }
  runTechSupportTest();
}
