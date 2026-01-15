import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Node } from './Node';
import { PacketView } from './PacketView';

export const Cluster: React.FC = () => {
    const nodes = useSimulationStore((state) => state.nodes);
    const initializeCluster = useSimulationStore((state) => state.initializeCluster);
    const sendGlobalTick = useSimulationStore((state) => state.sendGlobalTick);
    const isRunning = useSimulationStore((state) => state.isRunning);

    // Initialize on mount
    useEffect(() => {
        initializeCluster(5);
    }, [initializeCluster]);

    // Game Loop
    const lastTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);

    const tick = (time: number) => {
        if (lastTimeRef.current !== 0) {
            const dt = time - lastTimeRef.current;
            sendGlobalTick(dt);
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        if (isRunning) {
            lastTimeRef.current = 0;
            requestRef.current = requestAnimationFrame(tick);
        } else {
            cancelAnimationFrame(requestRef.current);
            lastTimeRef.current = 0;
        }

        return () => cancelAnimationFrame(requestRef.current);
    }, [isRunning, sendGlobalTick]);


    // Layout calculation (Circle)
    const radius = 150; // Reduced from 200
    const centerX = 225; // Half of 450
    const centerY = 225;

    // Helper to get position of a node index
    const getPosition = (index: number) => {
        const angle = (index / 5) * 2 * Math.PI - Math.PI / 2;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    };

    // We need to map node IDs to positions for packets
    const nodePositions = new Map<string, { x: number, y: number }>();
    Array.from(nodes.keys()).forEach((id, index) => {
        nodePositions.set(id, getPosition(index));
    });

    const packets = useSimulationStore(state => state.packets);

    return (
        <div className="relative w-[450px] h-[450px] border rounded-xl bg-white shadow-xl mx-auto mt-4 overflow-hidden">
            {/* Render Nodes */}
            {Array.from(nodes.entries()).map(([id, actor], index) => {
                const pos = getPosition(index);
                // Adjust for node center (node is ~128px wide? No, visual center)
                // The Node component is absolutely positioned.
                // We pass the CENTER coordinates to Node, and Node handles offset? 
                // Wait, previously: x = centerX + radius... - 64.
                // Let's keep previous logic for Node, but use center for Packets.

                const nodeX = pos.x - 64;
                const nodeY = pos.y - 64;

                return (
                    <Node
                        key={id}
                        actor={actor}
                        position={{ x: nodeX, y: nodeY }}
                    />
                );
            })}

            {/* Render Packets */}
            {packets.map(packet => {
                // Parse IDs to find index? "node-0" -> 0
                const fromIndex = parseInt(packet.from.split('-')[1]);
                const toIndex = parseInt(packet.to.split('-')[1]);

                const start = getPosition(fromIndex);
                const end = getPosition(toIndex);

                return (
                    <PacketView
                        key={packet.id}
                        packet={packet}
                        startPos={start}
                        endPos={end}
                    />
                );
            })}
        </div>
    );
};
