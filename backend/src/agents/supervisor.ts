import { StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { AgentState } from './state';

import { groqLLM } from './llm';
import { z } from 'zod';
import { SystemMessage } from '@langchain/core/messages';

/**
 * Supervisor Agent Node Logic
 * Leverages Groq's high-speed inference to autonomously classify user intent and route to specialized sub-agents.
 */
async function supervisorNode(state: typeof AgentState.State) {
  console.log('[Supervisor] Inspecting state to determine next routing action...');
  const lastMessage = state.messages[state.messages.length - 1];
  
  // Guardrail for local testing without an active API key
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('mock')) {
      const content = lastMessage ? lastMessage.content.toString().toLowerCase() : '';
      let route = 'logistics_agent';
      if (content.includes('billing') || content.includes('fraud')) route = 'finance_agent';
      else if (content.includes('refund') || content.includes('late')) route = 'refund_agent';
      else if (content.includes('technical') || content.includes('error') || content.includes('crash')) route = 'tech_support_agent';
      console.log(`[Supervisor] (Simulated) Intent classified. Routing to: ${route}`);
      return { next_agent: route };
  }

  // --- Real Groq LLM Inference (Phase 5) ---
  const routingSchema = z.object({
    next_agent: z.enum(['logistics_agent', 'finance_agent', 'refund_agent', 'tech_support_agent'])
      .describe('The specialized agent to route the task to based on the user intent.')
  });

  const structuredLlm = groqLLM.withStructuredOutput(routingSchema);
  
  const systemPrompt = new SystemMessage(`You are the central Supervisor of the OmniDesk-Agent swarm.
Your ONLY job is to route the user's message to the correct specialist sub-agent.
- logistics_agent: inventory, stock levels, warehouse, shipping.
- finance_agent: massive billing discrepancies, fraud alerts, or human escalation requests.
- refund_agent: minor micro-refunds (under $50), minor compensations, late deliveries.
- tech_support_agent: server crashes, 500 errors, 404 errors, technical documentation.
DO NOT answer the user. Just return the route.`);

  try {
    const response = await structuredLlm.invoke([systemPrompt, lastMessage]);
    console.log(`[Supervisor] Groq LLM Intent classified. Routing to: ${response.next_agent}`);
    return { next_agent: response.next_agent };
  } catch (error) {
    console.error('[Supervisor] Groq Routing Failed. Fallback to tech_support_agent.', error);
    return { next_agent: 'tech_support_agent' };
  }
}

import { logisticsNode } from './logistics';
import { techSupportNode } from './techSupport';
import { financeNode } from './finance';
import { refundNode } from './refund';

/**
 * Multi-Agent Swarm Orchestrator Engine
 * Compiles the LangGraph cyclic state machine with strict conditional routing.
 */
export const swarmEngine = new StateGraph(AgentState)
  .addNode('supervisor', supervisorNode)
  .addNode('logistics_agent', logisticsNode)
  .addNode('tech_support_agent', techSupportNode)
  .addNode('finance_agent', financeNode)
  .addNode('refund_agent', refundNode)
  // Define execution edges
  .addEdge(START, 'supervisor')
  // Conditional router parsing supervisor output
  .addConditionalEdges('supervisor', (state) => state.next_agent, {
    logistics_agent: 'logistics_agent',
    tech_support_agent: 'tech_support_agent',
    finance_agent: 'finance_agent',
    refund_agent: 'refund_agent',
  })
  .addEdge('logistics_agent', END)
  .addEdge('tech_support_agent', END)
  .addEdge('finance_agent', END)
  .addEdge('refund_agent', END)
  .compile();

// Verification execution
if (require.main === module) {
  async function runTest() {
    console.log('[Swarm] Initializing LangGraph Engine Architectural Test...');
    try {
      const result = await swarmEngine.invoke({
        messages: [new HumanMessage('I have a massive billing problem with my recent invoice.')]
      });
      console.log(`[Swarm] Graph Execution Completed. Final Router State: ${result.next_agent}`);
    } catch (e) {
      console.error('[Swarm] Fatal error in graph execution:', e);
      process.exit(1);
    }
  }
  runTest();
}
