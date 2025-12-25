import EvaluationBar from '@/components/EvaluationBar';
import GameSettings from '@/components/GameSettings';
import PlayerResources from '@/components/PlayerResources';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import React from 'react';

interface ControlsProps { }

const Controls: React.FC<ControlsProps> = () => {
    const { t } = useLanguage();

    const gameState = useGameStore(state => state.gameState);
    const humanPlayer = useGameStore(state => state.humanPlayer);
    const resetGame = useGameStore(state => state.resetGame);
    const undo = useGameStore(state => state.undo);

    const { tile_counts, current_player, game_over, winner } = gameState;
    const isMyTurn = current_player === humanPlayer;

    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl w-full max-w-sm border-0">
            <CardContent className="p-6 space-y-6">
                {/* Status Bar */}
                <div className={cn("text-center rounded-xl mb-6 font-bold text-lg tracking-wide transition-colors duration-500 border",
                    game_over
                        ? (winner === humanPlayer ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-red-500/20 border-red-500/50 text-red-300")
                        : (isMyTurn ? "bg-white/10 border-white/20 text-white animate-pulse" : "bg-black/20 border-transparent text-gray-500")
                )}>
                    {game_over
                        ? (winner === humanPlayer ? t.controls.victory : t.controls.defeat)
                        : (isMyTurn ? t.controls.yourTurn : t.controls.aiThinking)}
                </div>

                {/* Eval Bar */}
                <EvaluationBar />

                {/* Resources / Tile Counts */}
                <div className="space-y-4">
                    <PlayerResources tileCounts={tile_counts} targetPlayer={1} />
                    <PlayerResources tileCounts={tile_counts} targetPlayer={2} />
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => undo()}
                        variant="secondary"
                        className="flex-1 py-6 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold uppercase tracking-widest rounded-xl shadow-lg active:scale-95 text-xs h-auto"
                    >
                        {t.controls.undo}
                    </Button>
                    <Button
                        onClick={() => resetGame()}
                        className="flex-[2] py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] active:scale-95 text-sm h-auto border-0"
                    >
                        {t.controls.newGame}
                    </Button>
                </div>
                {/* Settings */}
                <GameSettings />


            </CardContent>
        </Card>
    );
};

export default Controls;
