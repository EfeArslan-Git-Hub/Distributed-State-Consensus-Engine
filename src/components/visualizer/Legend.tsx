import React from 'react';

export const Legend: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">Simulation Legend</h3>

            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-500 bg-slate-100 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-slate-700 block">Follower</span>
                        <p className="text-xs text-slate-500 leading-snug">
                            Passive state. Listens for Heartbeats from a Leader. If the timer runs out, it starts an election.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-amber-500 bg-amber-50 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-amber-700 block">Candidate</span>
                        <p className="text-xs text-slate-500 leading-snug">
                            Election Active! Voting for itself and asking others for votes. Needs majority (3/5) to win.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-emerald-500 bg-emerald-50 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-emerald-700 block">Leader</span>
                        <p className="text-xs text-slate-500 leading-snug">
                            Authority. Sends periodic Heartbeats to reset other nodes' timers and maintain control.
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t mt-2">
                    <p className="text-xs text-slate-400">
                        <b>Term:</b> Logical clock. Increments with every new election.<br />
                        <b>Node ID:</b> Unique address of each server (e.g., 192.168.1.x).
                    </p>
                </div>
            </div>
        </div>
    );
};
