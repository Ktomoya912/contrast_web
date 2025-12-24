import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Player } from '../types';

interface GameSettingsProps {
    humanPlayer: Player;
    setHumanPlayer: (p: Player) => void;
    simulationCount: number;
    setSimulationCount: (n: number) => void;
    className?: string;
}

const GameSettings: React.FC<GameSettingsProps> = ({ humanPlayer, setHumanPlayer, simulationCount, setSimulationCount, className = "" }) => {
    const { t, language, setLanguage } = useLanguage();
    
    const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            setSimulationCount(val);
        }
    };

    return (
        <div className={className}>
             {/* Language Settings */}
             <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Language / 言語</label>
                <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                    <button 
                        onClick={() => setLanguage('ja')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                            language === 'ja'
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        日本語
                    </button>
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                            language === 'en'
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        English
                    </button>
                </div>
             </div>

             {/* AI Settings */}
             <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.settings.aiStrength}</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                        { label: t.settings.weak, val: 50 },
                        { label: t.settings.normal, val: 200 },
                        { label: t.settings.strong, val: 400 },
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
                     <span className="text-xs text-gray-500">{t.settings.custom}:</span>
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
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.settings.selectSide}</label>
                <div className="flex gap-3">
                    <button 
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
                            humanPlayer === 1 
                            ? 'bg-game-p1/20 border-game-p1 text-white shadow-[0_0_15px_rgba(255,62,62,0.3)]' 
                            : 'bg-transparent border-white/10 text-gray-500 hover:bg-white/5'
                        }`}
                        onClick={() => setHumanPlayer(1)}
                    >
                        {t.settings.first}
                    </button>
                    <button 
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
                            humanPlayer === 2 
                            ? 'bg-game-p2/20 border-game-p2 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                            : 'bg-transparent border-white/10 text-gray-500 hover:bg-white/5'
                        }`}
                        onClick={() => setHumanPlayer(2)}
                    >
                        {t.settings.second}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameSettings;
