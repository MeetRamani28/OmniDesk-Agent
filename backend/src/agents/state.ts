import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

/**
 * Global LangGraph State Definition
 * Represents the persistent memory, chat history, and deterministic routing flags passed between nodes in the swarm.
 */
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  next_agent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => 'supervisor',
  }),
  ticket_id: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
