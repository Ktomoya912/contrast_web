import { useLanguage } from '@/contexts/LanguageContext';
import type { Player } from '@/types';
import React from 'react';

interface EvaluationBarProps {
    aiValue: number;
    humanPlayer: Player;
    className?: string; // Allow custom styling/positioning
}

const EvaluationBar: React.FC<EvaluationBarProps> = ({ aiValue, humanPlayer, className = "" }) => {
    const { t } = useLanguage();
    // aiValue is the evaluation from the AI's perspective (AI's winning probability: 1.0 = AI win, -1.0 = AI loss).
    // We want the display to be from the Human's perspective (1.0 = Human win).
    // So we simply invert it.
    const displayValue = -aiValue;

    // Normalize to 0-100% (0.5 =even)
    const percentage = Math.max(0, Math.min(100, (displayValue + 1) * 50));

    // Colors based on identity
    const p1Color = "text-red-500";
    const p1Bg = "bg-red-500";
    const p2Color = "text-blue-500";
    const p2Bg = "bg-blue-500";

    const humanTextColor = humanPlayer === 1 ? p1Color : p2Color;
    const humanBgColor = humanPlayer === 1 ? p1Bg : p2Bg;
    const aiTextColor = humanPlayer === 1 ? p2Color : p1Color;
    const aiBgColor = humanPlayer === 1 ? "bg-blue-900/30" : "bg-red-900/30";

    return (
        <div className={className}>
            {/* Status Text (Optional or part of Bar?) -> For mobile fixed bar, we might want just the bar?
                 But Controls.tsx had "Status Bar" separate.
                 Let's stick to just the Bar + Labels here.
             */}
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
                <span className={humanTextColor}>{t.app.you}</span>
                <span className="text-gray-600 font-mono text-[10px]">{displayValue > 0 ? "+" : ""}{displayValue.toFixed(2)}</span>
                <span className={aiTextColor}>AI</span>
            </div>
            <div className={`h-2 md:h-3 rounded-full overflow-hidden relative ${aiBgColor}`}>
                {/* Center mark */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10"></div>
                <div
                    className={`h-full transition-all duration-700 ease-out ${humanBgColor} shadow-[0_0_10px_currentColor]`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default EvaluationBar;
