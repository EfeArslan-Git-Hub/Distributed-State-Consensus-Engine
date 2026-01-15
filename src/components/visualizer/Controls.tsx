import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Play, Square, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export const Controls: React.FC = () => {
    const isRunning = useSimulationStore((state) => state.isRunning);
    const startSimulation = useSimulationStore((state) => state.startSimulation);
    const stopSimulation = useSimulationStore((state) => state.stopSimulation);
    const initializeCluster = useSimulationStore((state) => state.initializeCluster);

    return (
        <div className="flex gap-4 p-4 bg-white rounded-xl shadow-lg border mt-6 justify-center">
            <button
                onClick={isRunning ? stopSimulation : startSimulation}
                className={clsx(
                    "flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-colors",
                    isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                )}
            >
                {isRunning ? <><Square size={18} /> Stop</> : <><Play size={18} /> Start</>}
            </button>

            <button
                onClick={() => initializeCluster(5)}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
            >
                <RefreshCw size={18} /> Reset
            </button>
        </div>
    );
};
