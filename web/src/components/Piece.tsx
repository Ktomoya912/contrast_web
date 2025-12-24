import React from 'react';

interface PieceProps {
    player: number;  // 1 or 2
    className?: string; // For additional styling/positioning
}

const Piece: React.FC<PieceProps> = ({ player, className = "" }) => {
    
    // Internal helper for static arrows
    const getPieceArrows = () => (
        <>
            {/* Black Orthogonal Arrows */}
            <g className="text-slate-900 opacity-90">
                <path d="M12 4v16" />
                <path d="M4 12h16" />
                <path d="M9 7l3-3 3 3" />
                <path d="M9 17l3 3 3-3" />
                <path d="M7 15l-3-3 3-3" />
                <path d="M17 15l3-3-3-3" />
            </g>
            
            {/* White Diagonal Arrows */}
            <g className="text-white opacity-90">
                <path d="M5 5l14 14" />
                <path d="M19 5L5 19" />
                <path d="M8 5H5v3" />
                <path d="M16 19h3v-3" />
                <path d="M19 8V5h-3" />
                <path d="M5 16v3h3" />
            </g>
        </>
    );

    // Internal helper for SVG border path
    const getPieceBorder = (p: number) => {
        if (p === 1) { // P1 Red Up Pentagon
            return (
                <path 
                    d="M12 1.5 L22.5 6.5 L22.5 20.5 L1.5 20.5 L1.5 6.5 Z" 
                    fill="none" 
                    stroke="#ef4444" // Red-500
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="opacity-90 drop-shadow-md"
                />
            );
        } else { // P2 Blue Down Pentagon
            return (
                <path 
                    d="M1.5 3.5 L22.5 3.5 L22.5 17 L12 22.5 L1.5 17 Z" 
                    fill="none" 
                    stroke="#3b82f6" // Blue-500
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="opacity-90 drop-shadow-md"
                />
            );
        }
    };

    // Construct the full component structure
    // We use the same .piece classes for outer shell sizing/positioning/animations
    // But we render the SVG content inside.
    
    return (
        <div className={`piece piece-${player} flex justify-center items-center ${className}`}>
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {getPieceBorder(player)}
                <g transform="scale(0.7) translate(5,5)">
                    {getPieceArrows()}
                </g>
            </svg>
        </div>
    );
};

export default Piece;
