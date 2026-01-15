import React from 'react';
import { motion } from 'framer-motion';
import type { Packet } from '../../store/useSimulationStore';

interface PacketViewProps {
    packet: Packet;
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
}

export const PacketView: React.FC<PacketViewProps> = ({ packet, startPos, endPos }) => {
    // Determine color based on type
    let color = 'bg-yellow-400'; // VOTE_REQUEST
    if (packet.type === 'HEARTBEAT') color = 'bg-green-400';
    if (packet.type === 'VOTE_RESPONSE') color = 'bg-blue-400';

    return (
        <motion.div
            initial={{ x: startPos.x, y: startPos.y }}
            animate={{ x: endPos.x, y: endPos.y }}
            transition={{ duration: packet.duration / 1000, ease: "linear" }}
            className={`absolute w-3 h-3 rounded-full ${color} shadow-md z-20 pointer-events-none`}
        />
    );
};
