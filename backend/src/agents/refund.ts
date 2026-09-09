import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentState } from './state';
import { AIMessage } from '@langchain/core/messages';

/**
 * Tool: Process Micro-Refund
 * Safely processes refunds that fall strictly under the $50 policy threshold without human intervention.
 */
export const microRefundTool = tool(
  async ({ order_id, amount, reason }) => {
    console.log(`[Refund Tool] Evaluating micro-refund request for Order: ${order_id}`);
    
    // Strict Deterministic Policy Guardrail Sandbox
    if (amount > 50) {
      console.warn(`[Refund Tool] BLOCKED: Requested amount ($${amount}) exceeds $50 autonomous threshold.`);
      return JSON.stringify({ 
        status: 'rejected', 
        error: 'Amount exceeds autonomous threshold. Must route to human escalation.' 
      });
    }

    console.log(`[Refund Tool] APPROVED: Processing $${amount} refund for ${reason}.`);
    // In production, this would execute a Stripe API call and update the SQLite tickets table
    return JSON.stringify({ 
      status: 'success', 
      refund_id: `REF-${Math.floor(Math.random() * 1000000)}`,
      amount_refunded: amount 
    });
  },
  {
    name: 'process_micro_refund',
    description: 'Process an immediate micro-refund for an order, strictly capped at $50.',
    schema: z.object({
      order_id: z.string().describe('The alphanumeric order ID.'),
      amount: z.number().describe('The refund amount in USD. MUST be 50 or less. If higher, do not use this tool.'),
      reason: z.string().describe('The justification for the refund.'),
    }),
  }
);

export const refundTools = [microRefundTool];

/**
 * Refund & Micro-Compensation Sub-Agent Node
 * Enforces strict policy-safe execution layers before allowing DB mutations.
 */
export async function refundNode(state: typeof AgentState.State) {
  console.log('[Refund Agent] Received task. Enforcing autonomous policy guardrails...');
  
  const lastMessage = state.messages[state.messages.length - 1]?.content.toString() || '';
  let responseContent = 'I handle micro-compensations. Please provide your order ID and the requested amount.';
  
  // Simulated LLM reasoning trigger
  if (lastMessage.includes('$20') || lastMessage.includes('late')) {
    console.log('[Refund Agent] LLM determined request is eligible for autonomous micro-refund check.');
    const toolResult = await microRefundTool.invoke({ 
      order_id: 'ORD-999', 
      amount: 20, 
      reason: 'Late delivery compensation' 
    });
    
    responseContent = `I have automatically processed your compensation policy. System Response: ${toolResult}`;
  }

  return {
    messages: [new AIMessage(responseContent)],
    next_agent: 'END', 
  };
}

// Architectural Verification Script
if (require.main === module) {
  async function runRefundTest() {
    console.log('[Refund Agent] Running standalone integration test...');
    const mockState = {
      messages: [{ content: 'My delivery was extremely late, I demand a $20 refund.', _getType: () => 'human' } as any],
      next_agent: 'refund_agent',
      ticket_id: null
    };

    const result = await refundNode(mockState);
    console.log('[Refund Agent] Execution output:', result.messages[0].content);
  }
  runRefundTest();
}
