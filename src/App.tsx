import React from 'react';
import { Cluster } from './components/visualizer/Cluster';
import { Controls } from './components/visualizer/Controls';
import { Legend } from './components/visualizer/Legend';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Raft Consensus Engine</h1>
      <p className="text-slate-500 mb-1">Phase 1: Leader Election Visualization</p>

      <div className="text-slate-400 text-sm mb-4">
        Made by{' '}
        <a
          href="https://efe-arslan-portfolio.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 font-bold hover:text-blue-500 transition-colors"
        >
          Efe Arslan
        </a>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start justify-center w-full px-4">

        {/* Simulation Area */}
        <div className="flex flex-col items-center">
          <Cluster />
          <Controls />
        </div>

        {/* Info Area */}
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <Legend />

          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
            <p className="font-bold mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 ml-1">
              <li>Click <span className="font-bold text-green-600">Start</span> to begin.</li>
              <li>Watch the blue bars (Election Timer) fill up.</li>
              <li>When a bar fills, that node becomes a <b>Candidate</b>.</li>
              <li>It votes for itself and asks others.</li>
              <li>Adding network delay (Phase 2) will make this clearer!</li>
            </ol>
          </div>
        </div>

      </div>



    </div >
  );
}

export default App;
