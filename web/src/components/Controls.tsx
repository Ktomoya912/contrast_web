import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { GameState, Player } from '../types';
import EvaluationBar from './EvaluationBar';
import GameSettings from './GameSettings';
import PlayerResources from './PlayerResources';

interface ControlsProps {
    gameState: GameState;
    aiValue: number;
    humanPlayer: Player;
    setHumanPlayer: (p: Player) => void;
    onReset: () => void;
    onUndo: () => void;
    simulationCount: number;
    setSimulationCount: (n: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ gameState, aiValue, humanPlayer, setHumanPlayer, onReset, onUndo, simulationCount, setSimulationCount }) => {
    const { t } = useLanguage();
    const { tile_counts, current_player, game_over, winner } = gameState;
    const isMyTurn = current_player === humanPlayer;

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl p-6 w-full max-w-sm">
            {/* Status Bar */}
            <div className={`text-center py-4 rounded-xl mb-6 font-bold text-lg tracking-wide transition-colors duration-500 border ${
                game_over 
                    ? (winner === humanPlayer ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-red-500/20 border-red-500/50 text-red-300")
                    : (isMyTurn ? "bg-white/10 border-white/20 text-white animate-pulse" : "bg-black/20 border-transparent text-gray-500")
            }`}>
                {game_over 
                    ? (winner === humanPlayer ? t.controls.victory : t.controls.defeat) 
                    : (isMyTurn ? t.controls.yourTurn : t.controls.aiThinking)}
            </div>
            
            {/* Eval Bar */}
            <EvaluationBar 
                aiValue={aiValue}
                humanPlayer={humanPlayer}
                className="mb-8"
            />

            {/* Resources / Tile Counts */}
            <div className="space-y-4 mb-8">
                <PlayerResources tileCounts={tile_counts} targetPlayer={1} />
                <PlayerResources tileCounts={tile_counts} targetPlayer={2} />
            </div>

            {/* Settings */}
            <GameSettings 
                humanPlayer={humanPlayer}
                setHumanPlayer={setHumanPlayer}
                simulationCount={simulationCount}
                setSimulationCount={setSimulationCount}
            />
            
            <div className="flex gap-3">
                <button 
                    onClick={onUndo}
                    className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-xs"
                >
                    {t.controls.undo}
                </button>
                <button 
                    onClick={onReset}
                    className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] active:scale-95 text-sm"
                >
                    {t.controls.newGame}
                </button>
            </div>
        </div>
    );
};

export default Controls;
