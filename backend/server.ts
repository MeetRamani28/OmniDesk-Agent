import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app';
import { swarmEngine } from './src/agents/supervisor';
import { HumanMessage } from '@langchain/core/messages';

const PORT = process.env.PORT || 5000;

// Create HTTP Server wrapping the Express app
const httpServer = createServer(app);

// Initialize Socket.io on the same HTTP server for real-time agent streams
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io End-to-End Orchestrator Pipeline
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Listen for human input strictly emitted from ChatInterface.tsx
  socket.on('user_message', async (data: { content: string }) => {
    console.log(`[Swarm] Received message from ${socket.id}: "${data.content}"`);
    
    try {
      // 1. Invoke the LangGraph State Machine with the user's raw message
      const result = await swarmEngine.invoke({
        messages: [new HumanMessage(data.content)]
      });

      // 2. Extract the final AIMessage output from the graph state
      const finalMessage = result.messages[result.messages.length - 1];
      const replyContent = finalMessage?.content || '';
      const reply = typeof replyContent === 'string' ? replyContent : JSON.stringify(replyContent);

      // 3. Inspect for escalation markers (Simulated extraction for Phase 4)
      if (reply.includes('handoff_initiated') || reply.includes('escalated')) {
         socket.emit('handoff_alert', { 
           reason: 'Agent requested human intervention based on strict policy flags.', 
           priority: 'P1' 
         });
      }

      // 4. Emit the final intelligent response back to the ChatInterface UI
      socket.emit('agent_response', { content: reply.toString() });
      
    } catch (error) {
      console.error('[Swarm] Execution Failed:', error);
      socket.emit('agent_response', { content: 'CRITICAL ERROR: Swarm execution failed. Please check backend logs.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Bootstrap the server
httpServer.listen(PORT, () => {
  console.log(`[Server] OmniDesk-Agent backend running on http://localhost:${PORT}`);
  console.log(`[Environment] ${process.env.NODE_ENV}`);
});
