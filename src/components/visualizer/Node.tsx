import React from 'react';
import { useSelector } from '@xstate/react';
import type { RaftActor } from '../../store/useSimulationStore';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface NodeProps {
    actor: RaftActor;
    position: { x: number; y: number };
}

import { useSimulationStore } from '../../store/useSimulationStore';

export const Node: React.FC<NodeProps> = ({ actor, position }) => {
    // Access toggle action and dead status
    const toggleNode = useSimulationStore((state) => state.toggleNode);
    const isStopped = useSimulationStore((state) => state.deadNodes.has(actor.id));

    // Subscribe to actor state
    const snapshot = useSelector(actor, (state) => state);
    const { nodeId, term } = snapshot.context;
    const currentState = snapshot.value as string;
    // const isStopped = snapshot.status === 'stopped'; // Deprecated in favor of store state

    // Colors based on state
    const stateColors = {
        follower: 'border-slate-500 bg-slate-100',
        candidate: 'border-amber-500 bg-amber-50',
        leader: 'border-emerald-500 bg-emerald-50',
    };

    let statusColor = stateColors[currentState as keyof typeof stateColors] || 'border-gray-500';

    // Override for stopped state
    if (isStopped) {
        statusColor = 'border-red-900 bg-red-100 opacity-80 grayscale';
    }

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, x: position.x, y: position.y }}
            onClick={() => toggleNode(nodeId)}
            className={clsx(
                'absolute w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95',
                statusColor
            )}
        >
            <div className="text-xs font-bold uppercase tracking-wider mb-1">
                {isStopped ? 'OFFLINE' : currentState}
            </div>
            <div className="text-lg font-mono font-bold">{nodeId}</div>
            <div className="text-xs text-gray-500 mt-1">Term: {term}</div>

            {!isStopped && (
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {Math.floor(snapshot.context.elapsed)} / {Math.floor(snapshot.context.electionTimeout)} ms
                </div>
            )}

            {/* Timer Bar */}
            {!isStopped && currentState !== 'leader' && (
                <div className="absolute bottom-4 w-16 h-1 bg-gray-200 rounded overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-500"
                        style={{ width: `${(snapshot.context.elapsed / snapshot.context.electionTimeout) * 100}%` }}
                    />
                </div>
            )}
        </motion.div>
    );
};
