import Piece from '@/components/Piece';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import { cva } from 'class-variance-authority';
import React, { useState } from 'react';

// Props removed - using store
interface BoardProps { }

// Types
interface PendingMove {
    from: number;
    to: number;
}


const GLASS_PANEL = "bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl";

const tileVariants = cva(
    "relative size-16 md:size-20 rounded-lg md:rounded-xl transition-all duration-300 overflow-hidden flex justify-center items-center shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)] group",
    {
        variants: {
            type: {
                0: "bg-gradient-to-br from-slate-50 to-slate-200 border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_5px_rgba(0,0,0,0.1)]", // White
                1: "bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.3)]", // Black
                2: "bg-gradient-to-br from-slate-400 to-slate-600 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_5px_rgba(0,0,0,0.2)]", // Gray
            },
            selected: {
                true: "ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105 z-20",
            },
            validMove: {
                true: "ring-2 ring-emerald-400/50 hover:ring-emerald-400 hover:bg-emerald-400/10 z-10 scale-[1.02] cursor-pointer",
            },
            placementTarget: {
                true: "ring-2 ring-cyan-400 bg-cyan-400/20 animate-pulse z-30 scale-105 cursor-pointer",
            },
            dimmed: {
                true: "opacity-30 grayscale",
            }
        },
        defaultVariants: {
            type: 0
        }
    }
);

const Board: React.FC<BoardProps> = () => {
    // Store access
    const gameState = useGameStore(state => state.gameState);
    const humanPlayer = useGameStore(state => state.humanPlayer);
    const move = useGameStore(state => state.move);
    const getValidMoves = useGameStore(state => state.getValidMoves);

    const { t } = useLanguage();
    const { pieces, tiles, current_player, game_over, tile_counts } = gameState;
    const [selected, setSelected] = useState<number | null>(null);
    const [validMoves, setValidMoves] = useState<number[]>([]);

    // Tile Placement State
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
    const [placingTileType, setPlacingTileType] = useState<number | null>(null); // 1=Black, 2=Gray
    const [isPlacementOpen, setIsPlacementOpen] = useState(false);

    const handleCellClick = async (idx: number) => {
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
                move(pendingMove.from, pendingMove.to, { type: placingTileType, x: idx % 5, y: Math.floor(idx / 5) });

                // Allow animation to play out
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
                setIsPlacementOpen(true);
            } else {
                // No tiles, just move
                move(selected, idx);
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
                // Async fetch valid moves
                const moves = await getValidMoves(x, y);
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
        setIsPlacementOpen(false);
    };

    // Smooth closing helper
    const handleClose = (cb?: () => void) => {
        setIsPlacementOpen(false);
        setTimeout(() => {
            if (cb) cb();
            clearSelection();
        }, 150); // Small delay to allow dialog close animation to start/finish smoothly without state jump
    };

    const handleSkip = () => {
        if (!pendingMove) return;
        const from = pendingMove.from;
        const to = pendingMove.to;
        handleClose(() => move(from, to));
    };



    const handleSelectTile = (type: number) => {
        setPlacingTileType(type);
        setIsPlacementOpen(false);
    };

    return (
        <div className={cn(GLASS_PANEL, "p-4 md:p-6 shadow-2xl relative flex flex-col items-center")}>

            {/* Custom Cancel Button for Tile Placement Phase */}
            {pendingMove && placingTileType && (
                <div className="absolute top-4 z-40 animate-fadeIn">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearSelection}
                        className="shadow-lg hover:scale-105 transition-transform font-bold"
                    >
                        {t.board.cancel}
                    </Button>
                </div>
            )}

            {/* Shadcn Dialog for Tile Placement */}
            <Dialog open={isPlacementOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="bg-game-bg-dark border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t.board.placeTile}</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {t.board.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-4 justify-center py-6">
                        {tile_counts[(humanPlayer - 1) * 2 + 0] > 0 && (
                            <button
                                onClick={() => handleSelectTile(1)}
                                className={cn("p-4 rounded-xl transition-all hover:scale-105 ring-2 ring-transparent hover:ring-white/20", tileVariants({ type: 1 }))}
                            >
                                <span className="text-sm font-bold text-gray-300 sr-only">{t.board.tileBlack}</span>
                            </button>
                        )}
                        {tile_counts[(humanPlayer - 1) * 2 + 1] > 0 && (
                            <button
                                onClick={() => handleSelectTile(2)}
                                className={cn("p-4 rounded-xl transition-all hover:scale-105 ring-2 ring-transparent hover:ring-white/20", tileVariants({ type: 2 }))}
                            >
                                <span className="text-sm font-bold text-gray-300 sr-only">{t.board.tileGray}</span>
                            </button>
                        )}
                    </div>

                    <div className="flex justify-between items-center px-2">
                        <Button
                            variant="ghost"
                            onClick={() => handleClose()}
                            className="text-gray-500 hover:text-red-400 hover:bg-white/5"
                        >
                            {t.board.cancel}
                        </Button>
                        <Button
                            variant="link"
                            onClick={handleSkip}
                            className="text-gray-400 hover:text-white"
                        >
                            {t.board.skip}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Board Frame */}
            <div className={cn("absolute inset-0 bg-transparent rounded-2xl pointer-events-none transition-opacity duration-300", pendingMove ? "opacity-20" : "opacity-100")}></div>

            <div className="grid grid-cols-5 gap-3 relative z-10">
                {Array.from({ length: 25 }).map((_, idx) => {
                    const tileType = tiles[idx];
                    const piece = pieces[idx];
                    const isSelected = selected === idx;
                    const isValidMove = validMoves.includes(idx);

                    // Highlight valid tile placement spots
                    const isPlacementTarget = placingTileType !== null && tileType === 0 &&
                        !((piece !== 0 && idx !== pendingMove?.from) || idx === pendingMove?.to);

                    const isDimmed = pendingMove && !isPlacementTarget && !isSelected && idx !== pendingMove.to && !(idx === pendingMove.from);

                    return (
                        <div
                            key={idx}
                            className={tileVariants({
                                type: tileType as 0 | 1 | 2,
                                selected: isSelected,
                                validMove: isValidMove,
                                placementTarget: !!isPlacementTarget,
                                dimmed: !!isDimmed
                            })}
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
                                    className="[animation:fadeIn_0.3s_ease-out_forwards]"
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

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Coordinates */}
            {/* <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-around text-xs text-white/20 font-mono h-full py-6">
                <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
            </div>
            <div className="absolute -bottom-6 left-0 right-0 flex justify-around text-xs text-white/20 font-mono w-full px-6">
                <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>
            </div> */}
        </div>
    );
};

export default Board;
