import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-900 p-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-10 space-y-8 text-center border border-slate-100">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
          OmniDesk-Agent <span className="text-blue-600">Frontend</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
          The ultimate elite production-grade execution master environment is fully operational and styled with Tailwind v4.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <span className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold tracking-wide border border-blue-100 shadow-sm">
            React 19
          </span>
          <span className="px-5 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold tracking-wide border border-purple-100 shadow-sm">
            Vite
          </span>
          <span className="px-5 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-bold tracking-wide border border-teal-100 shadow-sm">
            Tailwind v4
          </span>
          <span className="px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold tracking-wide border border-amber-100 shadow-sm">
            TypeScript Strict
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;
