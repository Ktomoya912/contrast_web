import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";
import React from 'react';

interface PlayerResourcesProps {
    tileCounts: number[]; // [P1_Black, P1_Gray, P2_Black, P2_Gray]
    targetPlayer: number; // 1 or 2
    label?: string;       // "You", "Opponent", "Player 1", etc.
    className?: string;   // Extra classes
    compact?: boolean;    // For mobile headers
}

const PlayerResources: React.FC<PlayerResourcesProps> = ({ tileCounts, targetPlayer, label, className = "", compact = false }) => {
    const { t } = useLanguage();
    // Determine counts index base
    // P1: idx 0,1. P2: idx 2,3.
    const baseIdx = (targetPlayer - 1) * 2;
    const blackCount = tileCounts[baseIdx];
    const grayCount = tileCounts[baseIdx + 1];

    const pColor = targetPlayer === 1 ? "text-game-p1" : "text-game-p2";
    const pName = targetPlayer === 1 ? t.resources.red : t.resources.blue;
    const defaultLabel = targetPlayer === 1 ? t.resources.player1 : t.resources.player2;

    if (compact) {
        // Mobile compact view (Line: "Opponent (RED): [Icon] 3 [Icon] 1")
        return (
            <div className={cn("flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full border border-white/5", className)}>
                <span className={cn("text-xs font-bold", pColor)}>{label || pName}</span>
                <div className="flex gap-3">
                    <span className="text-xs text-white flex items-center gap-1">
                        <div className="border border-white size-4 bg-black" /> {blackCount}
                    </span>
                    <span className="text-xs text-white flex items-center gap-1">
                        <div className="border border-white size-4 bg-slate-500" /> {grayCount}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Card className={cn("bg-black/20 border-0 border-l-4 rounded-lg",
            targetPlayer === 1 ? 'border-game-p1' : 'border-game-p2',
            className
        )}>
            <CardContent className="p-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-300 text-xs uppercase tracking-wider">{label || defaultLabel}</span>
                    <span className={cn("font-bold", pColor)}>{pName}</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                        <span className="text-xs text-gray-500 mb-1">{t.resources.black}</span>
                        <span className="font-mono text-white">{blackCount}</span>
                    </div>
                    <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                        <span className="text-xs text-gray-500 mb-1">{t.resources.gray}</span>
                        <span className="font-mono text-white">{grayCount}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlayerResources;

