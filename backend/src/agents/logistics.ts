import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { db } from '../db/index';
import { AgentState } from './state';
import { AIMessage } from '@langchain/core/messages';

/**
 * Tool: Check Inventory
 * Connects directly to the Better-SQLite3 pool to fetch real-time stock levels.
 * Bound to the LLM via Zod schemas for strict structural validation.
 */
export const checkInventoryTool = tool(
  async ({ sku }) => {
    console.log(`[Logistics Tool] Executing SQLite query for SKU: ${sku}`);
    const query = db.prepare('SELECT name, stock_level, price FROM inventory WHERE sku = ?');
    const item = query.get(sku) as { name: string, stock_level: number, price: number } | undefined;
    
    if (!item) return JSON.stringify({ error: 'Item not found in inventory.', sku });
    return JSON.stringify(item);
  },
  {
    name: 'check_inventory',
    description: 'Query the warehouse database to check stock levels and pricing for a specific SKU.',
    schema: z.object({
      sku: z.string().describe('The unique Stock Keeping Unit identifier (e.g., SKU-123).'),
    }),
  }
);

export const logisticsTools = [checkInventoryTool];

/**
 * Logistics Sub-Agent Node
 * In Phase 5, this will bind the tools array to a high-speed Groq LLM.
 * For now, we simulate the LLM invoking the SQL tool to validate the architecture.
 */
export async function logisticsNode(state: typeof AgentState.State) {
  console.log('[Logistics Agent] Received task. Analyzing context...');
  
  const lastMessage = state.messages[state.messages.length - 1]?.content.toString() || '';
  let responseContent = 'I can help with logistics. Could you provide your SKU?';
  
  // Simulated LLM reasoning trigger
  if (lastMessage.includes('SKU-123')) {
    console.log('[Logistics Agent] LLM determined `check_inventory` tool is required.');
    const toolResult = await checkInventoryTool.invoke({ sku: 'SKU-123' });
    responseContent = `I checked the system. Tool Result: ${toolResult}`;
  }

  return {
    // Append the agent's response to the global message state
    messages: [new AIMessage(responseContent)],
    // Graceful handoff back to END (or Supervisor, depending on graph design)
    next_agent: 'END', 
  };
}

// Architectural Verification Script
if (require.main === module) {
  async function runLogisticsTest() {
    console.log('[Logistics Agent] Running standalone integration test...');
    
    // Seed DB with a mock item for testing
    db.exec("INSERT OR IGNORE INTO inventory (sku, name, stock_level, price) VALUES ('SKU-123', 'Quantum Keyboard', 45, 129.99)");
    
    const mockState = {
      messages: [{ content: 'Do you have SKU-123 in stock?', _getType: () => 'human' } as any],
      next_agent: 'logistics_agent',
      ticket_id: null
    };

    const result = await logisticsNode(mockState);
    console.log('[Logistics Agent] Execution output:', result.messages[0].content);
  }
  runLogisticsTest();
}
