import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { GameState, Player } from '../types';
import Piece from './Piece';

interface BoardProps {
    gameState: GameState;
    humanPlayer: Player;
    onMove: (from: number, to: number, tile?: {type: number, x: number, y: number}) => void;
    getValidMoves: (x: number, y: number) => number[];
}

// Types
interface PendingMove {
    from: number;
    to: number;
}

const Board: React.FC<BoardProps> = ({ gameState, humanPlayer, onMove, getValidMoves }) => {
    const { t } = useLanguage();
    const { pieces, tiles, current_player, game_over, tile_counts } = gameState;
    const [selected, setSelected] = useState<number | null>(null);
    const [validMoves, setValidMoves] = useState<number[]>([]);
    
    // Tile Placement State
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
    const [placingTileType, setPlacingTileType] = useState<number | null>(null); // 1=Black, 2=Gray

    const handleCellClick = (idx: number) => {
        if (game_over) return;
        if (current_player !== humanPlayer) return;

        // --- Tile Placement Phase ---
        if (pendingMove && placingTileType) {
            // User is trying to place a tile at 'idx'
            const tileType = tiles[idx];
            const piece = pieces[idx];
            
            // Simplified check: Tile must be White (0).
            if (tileType !== 0) return; // Must be white
            
            let isOccupied = piece !== 0;
            if (idx === pendingMove.from) isOccupied = false;
            if (idx === pendingMove.to) isOccupied = true;
            
            if (!isOccupied) {
                // Confirm Move + Tile
                const x = idx % 5;
                const y = Math.floor(idx / 5);
                onMove(pendingMove.from, pendingMove.to, { type: placingTileType, x, y });
                clearSelection();
            }
            return;
        }

        // --- Movement Phase ---
        const x = idx % 5;
        const y = Math.floor(idx / 5);
        const piece = pieces[idx];

        // If clicking on a valid move destination
        if (selected !== null && validMoves.includes(idx)) {
             // Check if we can place a tile?
             // Get current player tile counts
             const pIdx = humanPlayer - 1;
             const hasBlack = tile_counts[pIdx * 2 + 0] > 0;
             const hasGray = tile_counts[pIdx * 2 + 1] > 0;
             
             if (hasBlack || hasGray) {
                 // Enter Tile Placement Mode
                 setPendingMove({ from: selected, to: idx });
             } else {
                 // No tiles, just move
                 onMove(selected, idx);
                 clearSelection();
             }
             return;
        }
        
        // Normal selection logic
        if (piece === humanPlayer) {
            if (selected === idx) {
                clearSelection();
            } else {
                setSelected(idx);
                const moves = getValidMoves(x, y);
                setValidMoves(moves);
            }
        } else {
            clearSelection();
        }
    };
    
    const clearSelection = () => {
        setSelected(null);
        setValidMoves([]);
        setPendingMove(null);
        setPlacingTileType(null);
    };

    return (
        <div className="glass-panel p-4 md:p-6 shadow-2xl relative">


            {/* Tile Selection Overlay */ }
            {pendingMove && !placingTileType && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col justify-center items-center p-6 animate-fadeIn">
                    <h3 className="text-xl text-white font-bold mb-6">{t.board.placeTile}</h3>
                    <div className="flex gap-4 mb-6">
                        {tile_counts[(humanPlayer-1)*2+0] > 0 && (
                            <button 
                                onClick={() => setPlacingTileType(1)}
                                className="flex flex-col items-center gap-2 tile-black p-4 rounded-xl transition-all hover:scale-105"
                            >
                                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                                    <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M7 7l2.5 0M7 7l0 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M17 17l-2.5 0M17 17l0 -2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M17 7l0 2.5M17 7l-2.5 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M7 17l0 -2.5M7 17l2.5 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                <span className="text-sm font-bold text-gray-300">{t.board.tileBlack}</span>
                            </button>
                        )}
                        {tile_counts[(humanPlayer-1)*2+1] > 0 && (
                            <button 
                                onClick={() => setPlacingTileType(2)}
                                className="flex flex-col items-center gap-2 tile-gray p-4 rounded-xl transition-all hover:scale-105"
                            >
                                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                                     <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" strokeLinecap="round" />
                                </svg>
                                <span className="text-sm font-bold text-gray-300">{t.board.tileGray}</span>
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => { onMove(pendingMove.from, pendingMove.to); clearSelection(); }}
                        className="text-gray-400 hover:text-white underline"
                    >
                        {t.board.skip}
                    </button>
                    <button 
                        onClick={clearSelection}
                        className="absolute top-4 right-4 text-gray-500 hover:text-red-400"
                    >
                        {t.board.cancel}
                    </button>
                </div>
            )}
            
            {/* Board Frame */}
            <div className={`absolute inset-0 bg-transparent rounded-2xl pointer-events-none transition-opacity duration-300 ${pendingMove ? "opacity-20" : "opacity-100"}`}></div>
            
            <div className="grid grid-cols-5 gap-3 relative z-10">
                {Array.from({ length: 25 }).map((_, idx) => {
                    const tileType = tiles[idx];
                    const piece = pieces[idx];
                    const isSelected = selected === idx;
                    const isValidMove = validMoves.includes(idx);
                    
                    // Highlight valid tile placement spots
                    const isPlacementTarget = placingTileType !== null && tileType === 0 && 
                        !((piece !== 0 && idx !== pendingMove?.from) || idx === pendingMove?.to);
                    
                    // Base Classes
                    let baseClasses = "tile-base group ";
                    if (tileType === 0) baseClasses += "tile-white";
                    else if (tileType === 1) baseClasses += "tile-black";
                    else baseClasses += "tile-gray";

                    // Selection Glow
                    if (isSelected) {
                        baseClasses += " ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105 z-20";
                    }
                    
                    // Valid Move Target
                    if (isValidMove) {
                         baseClasses += " ring-2 ring-emerald-400/50 hover:ring-emerald-400 hover:bg-emerald-400/10 z-10 scale-[1.02] cursor-pointer";
                    }
                    
                    // Placement Target
                    if (isPlacementTarget) {
                        baseClasses += " ring-2 ring-cyan-400 bg-cyan-400/20 animate-pulse z-30 scale-105 cursor-pointer";
                    }
                    
                    // Dim others during pending
                    if (pendingMove && !isPlacementTarget && !isSelected && idx !== pendingMove.to && !(idx === pendingMove.from)) {
                        baseClasses += " opacity-30 grayscale";
                    }

                    return (
                        <div 
                            key={idx}
                            className={baseClasses}
                            onClick={() => handleCellClick(idx)}
                        >
                            {/* Ghost Piece */}
                            {pendingMove && idx === pendingMove.to && (
                                <Piece 
                                    player={humanPlayer} 
                                    className="opacity-50 absolute inset-0 m-auto" 
                                />
                            )}

                            {/* Actual Piece */}
                            {piece !== 0 && !(pendingMove && idx === pendingMove.from) && (
                                <Piece 
                                    player={piece} 
                                    className="cell-anim-enter" 
                                />
                            )}
                            
                            {/* Valid Move Indicator */}
                            {isValidMove && piece === 0 && (
                                <div className="absolute w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse z-20"></div>
                            )}
                            
                            {/* Capture Indicator */}
                            {isValidMove && piece !== 0 && (
                                <div className="absolute inset-0 border-4 border-red-500 rounded-xl animate-pulse z-20"></div>
                            )}
                            
                             {/* Placement Icon Hint */}
                            {isPlacementTarget && (
                                <div className="absolute inset-0 flex justify-center items-center text-cyan-800 text-3xl font-bold opacity-80 z-20">
                                    {placingTileType === 1 ? "✖" : "✳"}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Coordinates */}
            <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-around text-xs text-white/20 font-mono h-full py-6">
                <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
            </div>
            <div className="absolute -bottom-6 left-0 right-0 flex justify-around text-xs text-white/20 font-mono w-full px-6">
                <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>
            </div>
        </div>
    );
};

export default Board;
