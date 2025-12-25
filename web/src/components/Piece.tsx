import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import React from 'react';

const pieceVariants = cva(
    "size-10 md:size-16 flex justify-center items-center text-xl text-white font-black relative z-10 transition-all duration-300 backdrop-blur-[1px] [text-shadow:0_1px_2px_rgba(0,0,0,0)]",
    {
        variants: {
            player: {
                1: "drop-shadow-md [clip-path:polygon(50%_0%,100%_25%,100%_90%,0%_90%,0%_25%)]",
                2: "drop-shadow-md [clip-path:polygon(0%_10%,100%_10%,100%_75%,50%_100%,0%_75%)]",
            },
        },
    }
);

interface PieceProps extends React.HTMLAttributes<HTMLDivElement> {
    player: number;  // 1 or 2
}

const Piece: React.FC<PieceProps> = ({ player, className, ...props }) => {
    
    // Internal helper for static arrows
    const getPieceArrows = () => (
        <>
            {/* Black Orthogonal Arrows */}
            <g className="text-slate-900">
                <path d="M12 4v16" />
                <path d="M4 12h16" />
                <path d="M9 7l3-3 3 3" />
                <path d="M9 17l3 3 3-3" />
                <path d="M7 15l-3-3 3-3" />
                <path d="M17 15l3-3-3-3" />
                <path d="M7 15l-3-3 3-3" />
                <path d="M17 15l3-3-3-3" />
            </g>
            
            {/* White Diagonal Arrows */}
            <g className="text-white">
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

    return (
        <div className={cn(pieceVariants({ player: player as 1 | 2 }), className)} {...props}>
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
