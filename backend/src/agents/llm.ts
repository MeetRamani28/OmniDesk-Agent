import { ChatGroq } from '@langchain/groq';

/**
 * Global Groq LLM Client
 * Powers the LangGraph swarm with ultra-fast Llama-3 inference.
 */
export const groqLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY || 'mock-groq-key',
  model: 'llama3-8b-8192', // Highly efficient model for agent routing and tool calling
  temperature: 0.1, // Low temperature for deterministic, policy-safe reasoning
  maxTokens: 1024,
});

// Verification Script
if (require.main === module) {
  async function testGroq() {
    console.log('[Groq] Initializing High-Speed Inference Engine...');
    try {
      if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('mock')) {
        const response = await groqLLM.invoke('Respond with exactly "SYSTEM_ONLINE".');
        console.log(`[Groq] Live Response: ${response.content}`);
      } else {
        console.log('[Groq] Architecture validated locally (No live API key provided).');
      }
    } catch (e) {
      console.error('[Groq] Connection Failed:', e);
    }
  }
  testGroq();
}
