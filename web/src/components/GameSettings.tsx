import React from 'react';
import type { Player } from '../types';

interface GameSettingsProps {
    humanPlayer: Player;
    setHumanPlayer: (p: Player) => void;
    simulationCount: number;
    setSimulationCount: (n: number) => void;
    className?: string;
}

const GameSettings: React.FC<GameSettingsProps> = ({ humanPlayer, setHumanPlayer, simulationCount, setSimulationCount, className = "" }) => {
    
    const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            setSimulationCount(val);
        }
    };

    return (
        <div className={className}>
             {/* AI Settings */}
             <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
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
                        className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-cyan-500 font-mono"
                     />
                     <span className="text-xs text-gray-600">sims</span>
                </div>
            </div>

            {/* Player Selection */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
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
        </div>
    );
};

export default GameSettings;
