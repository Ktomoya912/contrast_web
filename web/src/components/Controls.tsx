import React from 'react';
import type { GameState, Player } from '../App';

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
    const { tile_counts, current_player, game_over, winner } = gameState;
    
    const p1_counts = [tile_counts[0], tile_counts[1]];
    const p2_counts = [tile_counts[2], tile_counts[3]];

    const isMyTurn = current_player === humanPlayer;
    
    // aiValue is the evaluation from the AI's perspective (AI's winning probability: 1.0 = AI win, -1.0 = AI loss).
    // We want the display to be from the Human's perspective (1.0 = Human win).
    // So we simply invert it.
    const displayValue = -aiValue;
    
    // Normalize to 0-100% (0.5 =even)
    // Value range likely -1 to 1.
    const percentage = Math.max(0, Math.min(100, (displayValue + 1) * 50));
    const isAdvantage = displayValue > 0.05;
    const isDisadvantage = displayValue < -0.05;

    const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            setSimulationCount(val);
        }
    };

    // Colors based on identity
    const p1Color = "text-red-500";
    const p1Bg = "bg-red-500";
    const p2Color = "text-blue-500";
    const p2Bg = "bg-blue-500";

    const humanTextColor = humanPlayer === 1 ? p1Color : p2Color;
    const humanBgColor = humanPlayer === 1 ? p1Bg : p2Bg;
    const aiTextColor = humanPlayer === 1 ? p2Color : p1Color;
    const aiBgColor = humanPlayer === 1 ? "bg-blue-900/30" : "bg-red-900/30"; // Darker background for the 'void'

    return (
        <div className="glass-panel p-6 w-full max-w-sm">
            {/* Status Bar */}
            <div className={`text-center py-4 rounded-xl mb-6 font-bold text-lg tracking-wide transition-colors duration-500 border ${
                game_over 
                    ? (winner === humanPlayer ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-red-500/20 border-red-500/50 text-red-300")
                    : (isMyTurn ? "bg-white/10 border-white/20 text-white animate-pulse" : "bg-black/20 border-transparent text-gray-500")
            }`}>
                {game_over 
                    ? (winner === humanPlayer ? "VICTORY" : "DEFEAT") 
                    : (isMyTurn ? "YOUR TURN" : "AI THINKING...")}
            </div>
            
            {/* Eval Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                    <span className={humanTextColor}>You</span>
                    <span className="text-gray-600 font-mono">{displayValue > 0 ? "+" : ""}{displayValue.toFixed(2)}</span>
                    <span className={aiTextColor}>AI</span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden relative ${aiBgColor}`}>
                     {/* Center mark */}
                     <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10"></div>
                     <div 
                        className={`h-full transition-all duration-700 ease-out ${humanBgColor} shadow-[0_0_10px_currentColor]`}
                        style={{ width: `${percentage}%` }}
                     ></div>
                </div>
            </div>

            {/* Resources / Tile Counts */}
            <div className="space-y-4 mb-8">
                {/* P1 Section */}
                <div className="bg-black/20 rounded-lg p-3 border-l-4 border-game-p1">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-300 text-xs uppercase tracking-wider">Player 01</span>
                        <span className="text-game-p1 font-bold">RED</span>
                    </div>
                    <div className="flex gap-2">
                         <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                            <span className="text-xs text-gray-500 mb-1">Black</span>
                            <span className="font-mono text-white">{p1_counts[0]}</span>
                         </div>
                         <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                            <span className="text-xs text-gray-500 mb-1">Gray</span>
                            <span className="font-mono text-white">{p1_counts[1]}</span>
                         </div>
                    </div>
                </div>

                {/* P2 Section */}
                <div className="bg-black/20 rounded-lg p-3 border-l-4 border-game-p2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-300 text-xs uppercase tracking-wider">Player 02</span>
                        <span className="text-game-p2 font-bold">BLUE</span>
                    </div>
                    <div className="flex gap-2">
                         <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                            <span className="text-xs text-gray-500 mb-1">Black</span>
                            <span className="font-mono text-white">{p2_counts[0]}</span>
                         </div>
                         <div className="flex-1 bg-black/40 rounded flex flex-col items-center py-1">
                            <span className="text-xs text-gray-500 mb-1">Gray</span>
                            <span className="font-mono text-white">{p2_counts[1]}</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* AI Settings */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">AI Strength</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                        { label: 'Weak', val: 50 },
                        { label: 'Normal', val: 200 },
                        { label: 'Strong', val: 400 },
                    ].map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => setSimulationCount(opt.val)}
                            className={`py-2 rounded text-xs font-bold transition-all border ${
                                simulationCount === opt.val
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                : 'bg-black/20 border-transparent text-gray-500 hover:bg-white/5'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                     <span className="text-xs text-gray-500">Custom:</span>
                     <input 
                        type="number" 
                        value={simulationCount}
                        onChange={handleSimChange}
                        className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-cyan-500"
                     />
                     <span className="text-xs text-gray-600">sims</span>
                </div>
            </div>

            {/* Player Selection */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Side</label>
                <div className="flex gap-3">
                    <button 
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
                            humanPlayer === 1 
                            ? 'bg-game-p1/20 border-game-p1 text-white shadow-[0_0_15px_rgba(255,62,62,0.3)]' 
                            : 'bg-transparent border-white/10 text-gray-500 hover:bg-white/5'
                        }`}
                        onClick={() => setHumanPlayer(1)}
                    >
                        FIRST (P1)
                    </button>
                    <button 
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
                            humanPlayer === 2 
                            ? 'bg-game-p2/20 border-game-p2 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                            : 'bg-transparent border-white/10 text-gray-500 hover:bg-white/5'
                        }`}
                        onClick={() => setHumanPlayer(2)}
                    >
                        SECOND (P2)
                    </button>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={onUndo}
                    className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-xs"
                >
                    Undo
                </button>
                <button 
                    onClick={onReset}
                    className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] active:scale-95 text-sm"
                >
                    New Game
                </button>
            </div>
        </div>
    );
};

export default Controls;
