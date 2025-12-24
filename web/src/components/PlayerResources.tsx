import React from 'react';
import type { Player } from '../types';

interface PlayerResourcesProps {
    tileCounts: number[]; // Full array [P1_B, P1_G, P2_B, P2_G]
    targetPlayer: Player; // Which player to display resources for
    label?: string; // Optional label override (e.g. "Opponent")
    className?: string;
    compact?: boolean; // For mobile headers
}

const PlayerResources: React.FC<PlayerResourcesProps> = ({ tileCounts, targetPlayer, label, className = "", compact = false }) => {
    // Determine counts index base
    // P1: idx 0,1. P2: idx 2,3.
    const baseIdx = (targetPlayer - 1) * 2;
    const blackCount = tileCounts[baseIdx];
    const grayCount = tileCounts[baseIdx + 1];

    const pColor = targetPlayer === 1 ? "text-game-p1" : "text-game-p2";
    const pName = targetPlayer === 1 ? "RED" : "BLUE";
    const defaultLabel = targetPlayer === 1 ? "Player 01" : "Player 02";

    if (compact) {
        // Mobile compact view (Line: "Opponent (RED): [Icon] 3 [Icon] 1")
        return (
            <div className={`flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full border border-white/5 ${className}`}>
                <span className={`text-xs font-bold ${pColor}`}>{label || pName}</span>
                <div className="flex gap-3">
                    <span className="text-xs text-white flex items-center gap-1">
                        <span className="text-gray-500">⬛</span> {blackCount}
                    </span>
                    <span className="text-xs text-white flex items-center gap-1">
                        <span className="text-gray-500">⬜</span> {grayCount}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-black/20 rounded-lg p-3 border-l-4 ${targetPlayer === 1 ? 'border-game-p1' : 'border-game-p2'} ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-300 text-xs uppercase tracking-wider">{label || defaultLabel}</span>
                <span className={`${pColor} font-bold`}>{pName}</span>
            </div>
            <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                    <span className="text-xs text-gray-500 mb-1">Black</span>
                    <span className="font-mono text-white">{blackCount}</span>
                    </div>
                    <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                    <span className="text-xs text-gray-500 mb-1">Gray</span>
                    <span className="font-mono text-white">{grayCount}</span>
                    </div>
            </div>
        </div>
    );
};

export default PlayerResources;
