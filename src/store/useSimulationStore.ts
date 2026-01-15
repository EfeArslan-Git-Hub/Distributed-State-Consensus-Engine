import { create } from 'zustand';
import { createActor, type ActorRefFrom } from 'xstate';
import { raftMachine } from '../core/raft/raftMachine';

export type RaftActor = ActorRefFrom<typeof raftMachine>;

export interface Packet {
    id: string;
    from: string;
    to: string;
    type: 'VOTE_REQUEST' | 'VOTE_RESPONSE' | 'HEARTBEAT';
    duration: number; // ms
}

interface SimulationState {
    nodes: Map<string, RaftActor>;
    deadNodes: Set<string>;
    packets: Packet[]; // Visual packets
    isRunning: boolean;

    // Actions
    initializeCluster: (count: number) => void;
    startSimulation: () => void;
    stopSimulation: () => void;
    toggleNode: (nodeId: string) => void; // For "kill/revive" simulation
    sendGlobalTick: (dt: number) => void;
    addPacket: (packet: Packet) => void;
    removePacket: (id: string) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
    nodes: new Map(),
    deadNodes: new Set(),
    packets: [],
    isRunning: false,

    addPacket: (packet) => set((state) => ({ packets: [...state.packets, packet] })),
    removePacket: (id) => set((state) => ({ packets: state.packets.filter(p => p.id !== id) })),

    initializeCluster: (count) => {
        const newNodes = new Map<string, RaftActor>();
        set({ packets: [] }); // Clear packets

        // Stop existing actors if any
        get().nodes.forEach(actor => actor.stop());

        for (let i = 0; i < count; i++) {
            const nodeId = `node-${i}`;
            const actor = createActor(raftMachine, {
                input: { nodeId },
                id: nodeId
            });

            // Simulate Network Layer
            actor.subscribe((snapshot) => {
                const { deadNodes, addPacket, removePacket } = get();

                // If this node is dead, it is MUTE (cannot send)
                if (deadNodes.has(nodeId)) return;

                const { value, context } = snapshot;

                // If became Candidate, broadcast VOTE_REQUEST
                if (value === 'candidate' && context.votesReceived.size === 1) {
                    const peers = Array.from(newNodes.values()).filter(a => a.id !== nodeId);

                    peers.forEach(peer => {
                        // Visual & Network Delay
                        const duration = 400 + Math.random() * 200;

                        // Visual: Launch Packet
                        const packetId = `${nodeId}-${peer.id}-${Date.now()}`;
                        addPacket({
                            id: packetId,
                            from: nodeId,
                            to: peer.id,
                            type: 'VOTE_REQUEST',
                            duration
                        });

                        setTimeout(() => {
                            removePacket(packetId); // Clean up visual

                            // Re-check liveness after delay
                            const currentDeadNodes = get().deadNodes;
                            if (currentDeadNodes.has(nodeId)) return; // Sender died
                            if (currentDeadNodes.has(peer.id)) return; // Receiver died

                            // Send Request
                            peer.send({
                                type: 'VOTE_REQUEST',
                                candidateId: nodeId,
                                term: context.term
                            });

                            // Simulate Response Delay (Round Trip)
                            const respDelay = 400;
                            setTimeout(() => {
                                const freshDeadNodes = get().deadNodes;
                                if (freshDeadNodes.has(nodeId) || freshDeadNodes.has(peer.id)) return;

                                const peerSnapshot = peer.getSnapshot();
                                const canGrant = peerSnapshot.context.votedFor === nodeId && peerSnapshot.context.term === context.term;

                                if (canGrant) {
                                    // Visual: Launch Response Packet
                                    const respId = `${peer.id}-${nodeId}-resp-${Date.now()}`;
                                    addPacket({
                                        id: respId,
                                        from: peer.id,
                                        to: nodeId,
                                        type: 'VOTE_RESPONSE',
                                        duration: respDelay
                                    });

                                    setTimeout(() => {
                                        removePacket(respId);
                                        actor.send({
                                            type: 'VOTE_RESPONSE',
                                            term: context.term,
                                            granted: true,
                                            from: peer.id
                                        });
                                    }, respDelay);
                                }
                            }, 100); // Small processing/latency for response
                        }, duration);
                    });
                }

                // If became Leader, broadcast HEARTBEAT
                if (value === 'leader') {
                    const peers = Array.from(newNodes.values()).filter(a => a.id !== nodeId);
                    peers.forEach(peer => {
                        // If peer is dead, it is DEAF
                        if (deadNodes.has(peer.id)) return;

                        // Heartbeats are slightly faster but visible
                        const duration = 300;
                        const tickId = `${nodeId}-${peer.id}-hb-${Date.now()}`;

                        addPacket({
                            id: tickId,
                            from: nodeId,
                            to: peer.id,
                            type: 'HEARTBEAT',
                            duration
                        });

                        setTimeout(() => {
                            removePacket(tickId);
                            peer.send({ type: 'HEARTBEAT', leaderId: nodeId, term: context.term });
                        }, duration);
                    });
                }
            });

            newNodes.set(nodeId, actor);
        }

        set({ nodes: newNodes, deadNodes: new Set(), isRunning: false });
    },

    startSimulation: () => {
        const { nodes } = get();
        nodes.forEach(actor => actor.start());
        set({ isRunning: true });
    },

    stopSimulation: () => {
        set({ isRunning: false });
    },

    toggleNode: (nodeId) => {
        const { deadNodes } = get();
        const newDeadNodes = new Set(deadNodes);

        if (newDeadNodes.has(nodeId)) {
            newDeadNodes.delete(nodeId); // Revive
        } else {
            newDeadNodes.add(nodeId); // Kill
        }

        set({ deadNodes: newDeadNodes });
    },

    sendGlobalTick: (dt) => {
        const { nodes, deadNodes, isRunning } = get();
        if (!isRunning) return;

        nodes.forEach((actor, nodeId) => {
            // Only tick 'alive' nodes
            if (!deadNodes.has(nodeId) && actor.getSnapshot().status === 'active') {
                actor.send({ type: 'TICK', dt });
            }
        });
    }
}));
