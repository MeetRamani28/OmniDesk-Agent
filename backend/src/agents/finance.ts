import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentState } from './state';
import { AIMessage } from '@langchain/core/messages';

/**
 * Tool: Human Escalation Trigger
 * Emits a structured flag to alert the system that human intervention is required for a sensitive financial request.
 */
export const humanHandoffTool = tool(
  async ({ reason, severity }) => {
    console.log(`[Finance Tool] ALERT: Triggering Warm Human Escalation Protocol.`);
    console.log(`[Finance Tool] Reason: ${reason} | Severity: ${severity}`);
    
    // In production (Phase 4), this will emit a Socket.io event to a live agent dashboard.
    return JSON.stringify({ 
      status: 'handoff_initiated', 
      escalation_reason: reason,
      priority: severity === 'high' ? 'P1' : 'P2' 
    });
  },
  {
    name: 'trigger_human_handoff',
    description: 'Trigger a warm handoff to a live human agent when a financial request exceeds safe autonomous limits or involves fraud.',
    schema: z.object({
      reason: z.string().describe('The precise reason why human intervention is required.'),
      severity: z.enum(['low', 'high']).describe('The severity of the escalation.'),
    }),
  }
);

export const financeTools = [humanHandoffTool];

/**
 * Finance & Escalation Sub-Agent Node
 * Evaluates billing inquiries and enforces strict escalation guardrails.
 */
export async function financeNode(state: typeof AgentState.State) {
  console.log('[Finance Agent] Received task. Analyzing financial context...');
  
  const lastMessage = state.messages[state.messages.length - 1]?.content.toString() || '';
  let responseContent = 'I am the Finance Specialist. How can I assist with your billing inquiry?';
  
  // Simulated LLM reasoning trigger for high-severity issues
  if (lastMessage.includes('massive billing problem') || lastMessage.includes('fraud')) {
    console.log('[Finance Agent] LLM determined request requires live human supervision. Engaging handoff protocol.');
    const toolResult = await humanHandoffTool.invoke({ 
      reason: 'Potential fraud or massive billing discrepancy detected.', 
      severity: 'high' 
    });
    
    responseContent = `I have securely escalated your case to a live human finance manager. System Response: ${toolResult}`;
  }

  return {
    messages: [new AIMessage(responseContent)],
    next_agent: 'END', // Reaches end of graph logic, handing off control back to the user or human UI
  };
}

// Architectural Verification Script
if (require.main === module) {
  async function runFinanceTest() {
    console.log('[Finance Agent] Running standalone integration test...');
    
    const mockState = {
      messages: [{ content: 'I have a massive billing problem with my recent invoice.', _getType: () => 'human' } as any],
      next_agent: 'finance_agent',
      ticket_id: null
    };

    const result = await financeNode(mockState);
    console.log('[Finance Agent] Execution output:', result.messages[0].content);
  }
  runFinanceTest();
}
