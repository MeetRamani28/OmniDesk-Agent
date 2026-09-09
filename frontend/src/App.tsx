import React from 'react';
import { ChatInterface } from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center font-sans p-4 lg:p-8">
      <ChatInterface />
    </div>
  );
};

export default App;
