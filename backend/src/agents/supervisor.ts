import { StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { AgentState } from './state';

/**
 * Supervisor Agent Node Logic
 * This node inspects the conversational state and routes to the strict specialized sub-agents.
 */
async function supervisorNode(state: typeof AgentState.State) {
  console.log('[Supervisor] Inspecting state to determine next routing action...');
  // In Phase 5 (Step 20), this will invoke a Groq LLM with a highly structural intent prompt.
  // Currently, we simulate intent routing for architectural validation.
  
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage ? lastMessage.content.toString().toLowerCase() : '';
  
  let route = 'logistics_agent'; // default fallback
  
  if (content.includes('billing') || content.includes('refund')) {
    route = 'finance_agent';
  } else if (content.includes('technical') || content.includes('error')) {
    route = 'tech_support_agent';
  }

  console.log(`[Supervisor] Intent classified. Routing to: ${route}`);
  return { next_agent: route };
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
