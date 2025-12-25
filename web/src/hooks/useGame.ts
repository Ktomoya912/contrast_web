import type { GameState, Player } from '@/types';
import { INITIAL_STATE } from '@/types';
import { useCallback, useEffect, useState } from 'react';

// Define the Wasm module interface
interface WasmModule {
    init_game: (model_path: string) => void;
    reset_game: (human_player: number) => void;
    get_state: () => any;
    get_valid_moves: (x: number, y: number) => number[];
    step: (action: number) => { success: boolean, game_over: boolean, winner: number, error?: string };
    undo: () => boolean;
    ai_think: (sims: number) => { action: number, value: number };
    decode_action: (hash: number) => any;
    FS: any;
}

declare global {
    interface Window {
        ContrastModule: any;
    }
}

export function useGame() {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [module, setModule] = useState<WasmModule | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiValue, setAiValue] = useState<number>(0);
    const [simulationCount, setSimulationCount] = useState<number>(200);

    // Initialize Wasm
    useEffect(() => {
        const loadWasm = async () => {
            try {
                if (!window.ContrastModule) {
                    console.log("Waiting for Wasm script to load...");
                    return; 
                }
                
                const mod = await window.ContrastModule();
                console.log("Wasm Module Loaded");
                
                const baseUrl = import.meta.env.BASE_URL;
                const modelUrl = `${baseUrl}model.bin`.replace('//', '/');
                
                const response = await fetch(modelUrl);
                if (!response.ok) throw new Error(`Failed to fetch model.bin from ${modelUrl}`);
                const buffer = await response.arrayBuffer();
                const data = new Uint8Array(buffer);
                
                mod.FS.writeFile('/model.bin', data);
                
                mod.init_game('/model.bin');
                setModule(mod);
                
                syncState(mod);
                
            } catch (e: any) {
                console.error("Wasm Init Error:", e);
                setError("Failed to load Game Engine: " + e.message);
            }
        };
        
        loadWasm();
    }, []);

    const syncState = (mod: WasmModule) => {
        const raw = mod.get_state();
        if (raw) {
            const s: GameState = {
                pieces: raw.pieces,
                tiles: raw.tiles,
                tile_counts: raw.tile_counts,
                current_player: raw.current_player as Player,
                game_over: raw.game_over,
                winner: raw.winner,
                move_count: raw.move_count
            };
            setGameState(s);
        }
    };

    const resetGame = useCallback((humanPlayer: Player) => {
        if (!module) return;
        module.reset_game(humanPlayer);
        setAiValue(0);
        setError(null);
        syncState(module);
        
        if (humanPlayer === 2) {
            triggerAI(); 
        }
    }, [module]);

    const triggerAI = useCallback(async () => {
        if (!module) return;
        setIsThinking(true);
        
        // Capture current sim count in closure or use ref if needed. 
        // State is fine as long as triggerAI depend on it.
        
        setTimeout(() => {
            try {
                const res = module.ai_think(simulationCount); 
                if (res && typeof res === 'object') {
                    if (res.action >= 0) {
                        module.step(res.action);
                        syncState(module);
                        setAiValue(res.value);
                    }
                }
            } catch(e) {
                console.error("AI Error", e);
                setError("AI processing failed");
            } finally {
                setIsThinking(false);
            }
        }, 50);
    }, [module, simulationCount]);

    const move = useCallback((from: number, to: number, tile?: {type: number, x: number, y: number}) => {
        if (!module) return;
        
        const move_idx = from * 25 + to;
        let tile_idx = 0;
        
        if (tile) {
           const t_loc = tile.y * 5 + tile.x;
           if (tile.type === 1) tile_idx = 1 + t_loc; 
           else if (tile.type === 2) tile_idx = 26 + t_loc;
        }
        
        const hash = move_idx * 51 + tile_idx;
        
        const res = module.step(hash);
        if (res.success) {
            syncState(module);
            setError(null);
        } else {
            console.error("Move failed:", res.error);
            setError(res.error || "Illegal Move");
        }
    }, [module]);
    
    const undo = useCallback((targetPlayer?: Player) => {
        if (!module) return;
        
        let success = module.undo();
        if (success) {
            // Check if we need to undo further to reach target player's turn
            // This handles AI games where we want to revert AI move + Human move
            const raw = module.get_state();
            if (targetPlayer && raw.current_player !== targetPlayer) {
                // Try undoing one more time
                module.undo();
            }
            
            syncState(module);
            setError(null);
            setAiValue(0); // Clear AI prediction on undo
        }
    }, [module]);

    const getValidMoves = (x: number, y: number): number[] => {
        if (!module) return [];
        return module.get_valid_moves(x, y);
    };

    return {
        gameState,
        aiValue,
        resetGame,
        move,
        undo,
        getValidMoves,
        triggerAI,
        isThinking,
        error, 
        isReady: !!module,
        simulationCount,
        setSimulationCount
    };
}
