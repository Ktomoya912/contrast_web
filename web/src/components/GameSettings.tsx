import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";
import { useGameStore } from '@/store/useGameStore';
import React from 'react';

interface GameSettingsProps {
    className?: string;
}

const GameSettings: React.FC<GameSettingsProps> = ({ className = "" }) => {
    const { t, language, setLanguage } = useLanguage();

    const humanPlayer = useGameStore(state => state.humanPlayer);
    const setHumanPlayer = useGameStore(state => state.setHumanPlayer);
    const simulationCount = useGameStore(state => state.simulationCount);
    const setSimulationCount = useGameStore(state => state.setSimulationCount);

    const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            setSimulationCount(val);
        }
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Language Settings */}


            {/* AI Settings */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-white">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.settings.aiStrength}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                            { label: t.settings.weak, val: 50 },
                            { label: t.settings.normal, val: 200 },
                            { label: t.settings.strong, val: 400 },
                        ].map(opt => (
                            <Button
                                key={opt.label}
                                onClick={() => setSimulationCount(opt.val)}
                                variant={simulationCount === opt.val ? "default" : "outline"}
                                className={cn("h-8 text-xs font-bold border-transparent",
                                    simulationCount === opt.val
                                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-200"
                                        : "bg-black/20 text-gray-500 hover:bg-white/5 hover:text-gray-300"
                                )}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16">{t.settings.custom}:</span>
                        <div className="flex-1 flex items-center gap-2">
                            <Input
                                type="number"
                                value={simulationCount}
                                onChange={handleSimChange}
                                className="h-8 bg-black/30 border-white/10 text-white text-xs font-mono focus-visible:ring-cyan-500"
                            />
                            <span className="text-xs text-gray-600">sims</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Player Selection */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-white">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.settings.selectSide}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setHumanPlayer(1)}
                            className={cn("flex-1 h-12 font-bold text-sm border-2",
                                humanPlayer === 1
                                    ? "bg-game-p1/20 border-game-p1 text-white hover:bg-game-p1/30"
                                    : "bg-transparent border-white/10 text-gray-500 hover:bg-white/5"
                            )}
                        >
                            {t.settings.first}
                        </Button>
                        <Button
                            onClick={() => setHumanPlayer(2)}
                            className={cn("flex-1 h-12 font-bold text-sm border-2",
                                humanPlayer === 2
                                    ? "bg-game-p2/20 border-game-p2 text-white hover:bg-game-p2/30"
                                    : "bg-transparent border-white/10 text-gray-500 hover:bg-white/5"
                            )}
                        >
                            {t.settings.second}
                        </Button>
                    </div>
                </CardContent>
            </Card><Card className="bg-white/5 border-white/10 backdrop-blur-sm text-white">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Language / 言語</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex gap-2">
                        <Button
                            variant={language === 'ja' ? "default" : "secondary"}
                            onClick={() => setLanguage('ja')}
                            className={cn("flex-1 h-8 text-xs font-bold", language === 'ja' ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "bg-black/30 text-gray-400 hover:text-white hover:bg-white/10")}
                        >
                            日本語
                        </Button>
                        <Button
                            variant={language === 'en' ? "default" : "secondary"}
                            onClick={() => setLanguage('en')}
                            className={cn("flex-1 h-8 text-xs font-bold", language === 'en' ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "bg-black/30 text-gray-400 hover:text-white hover:bg-white/10")}
                        >
                            English
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GameSettings;
