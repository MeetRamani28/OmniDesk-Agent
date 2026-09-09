import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ShieldAlert } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { useSocket } from '../hooks/useSocket';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-sys',
      sender: 'system',
      content: 'Welcome to the OmniDesk-Agent Swarm. The production environment is ready. How can we assist you?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    socket.on('agent_response', (data: { content: string }) => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'agent',
        content: data.content,
        timestamp: new Date()
      }]);
    });

    socket.on('handoff_alert', (data: { reason: string, priority: string }) => {
      setIsTyping(false);
      toast.error(`Escalation (${data.priority}): ${data.reason}`, { duration: 6000 });
    });

    return () => {
      socket.off('agent_response');
      socket.off('handoff_alert');
    };
  }, [socket]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!isConnected) {
      toast.error('Socket disconnected. Ensure the backend server is running on port 5000.');
      return;
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    // Emit the message securely to the LangGraph Backend
    socket.emit('user_message', { content: newMessage.content });
  };

  return (
    <div className="flex flex-col h-[85vh] max-h-[800px] w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <h2 className="text-white font-bold tracking-wide">OmniDesk-Agent Swarm</h2>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <span>Zero-Trust Secured</span>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                msg.sender === 'user' ? 'bg-blue-600' : 
                msg.sender === 'system' ? 'bg-slate-700' : 'bg-emerald-600'
              }`}>
                {msg.sender === 'user' ? <User className="text-white w-5 h-5" /> : <Bot className="text-white w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl shadow-sm border ${
                msg.sender === 'user' ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none' : 
                msg.sender === 'system' ? 'bg-slate-200 text-slate-800 border-slate-300 rounded-tl-none font-semibold text-center' : 
                'bg-white text-slate-800 border-slate-200 rounded-tl-none'
              }`}>
                {msg.sender === 'user' || msg.sender === 'system' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-800">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                <span className={`text-[10px] mt-2 block opacity-70 ${msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%] flex-row">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-emerald-600">
                <Bot className="text-white w-5 h-5" />
              </div>
              <div className="p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-slate-200 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                <span className="text-sm text-slate-500 font-medium tracking-wide">Agent is reasoning...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-slate-200">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected}
            placeholder={isConnected ? "Message the Agent Swarm..." : "Connecting to backend orchestrator (Ensure port 5000 is active)..."}
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          <button 
            type="submit" 
            disabled={!isConnected || !input.trim()}
            className="absolute right-2 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
