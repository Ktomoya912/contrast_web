import { type GameState, INITIAL_STATE, type Player } from '@/types';
import { create } from 'zustand';

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

interface GameStore {
    // State
    gameState: GameState;
    humanPlayer: Player | 0; // 0 = Spectator (AI vs AI)
    aiValue: number;
    simulationCount: number;
    isThinking: boolean;
    error: string | null;
    isReady: boolean;
    
    // Actions
    setHumanPlayer: (p: Player | 0) => void;
    setSimulationCount: (n: number) => void;
    initialize: () => Promise<void>;
    resetGame: (startPlayer?: Player) => void;
    move: (from: number, to: number, tile?: { type: number, x: number, y: number }) => void;
    undo: () => void;
    triggerAI: () => Promise<void>;
    getValidMoves: (x: number, y: number) => number[];
}

// Module instance kept outside reactive store to avoid proxy issues
let module: WasmModule | null = null;

export const useGameStore = create<GameStore>((set, get) => ({
    gameState: INITIAL_STATE,
    humanPlayer: 1, // Default to Player 1
    aiValue: 0,
    simulationCount: 200,
    isThinking: false,
    error: null,
    isReady: false,

    setHumanPlayer: (p) => set({ humanPlayer: p }),
    setSimulationCount: (n) => set({ simulationCount: n }),

    initialize: async () => {
        if (module) return; // Already initialized

        try {
            // Poll for the module if it's not ready yet (up to 2 seconds)
            let retries = 20;
            while (!window.ContrastModule && retries > 0) {
                console.log("Waiting for Wasm script to load...", retries);
                await new Promise(resolve => setTimeout(resolve, 100));
                retries--;
            }

            if (!window.ContrastModule) {
                throw new Error("Wasm script (contrast.js) failed to load or is missing.");
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
            
            module = mod;
            
            // Sync initial state
            const raw = mod.get_state();
            if (raw) {
                set({
                    isReady: true,
                    gameState: {
                        pieces: raw.pieces,
                        tiles: raw.tiles,
                        tile_counts: raw.tile_counts,
                        current_player: raw.current_player as Player,
                        game_over: raw.game_over,
                        winner: raw.winner,
                        move_count: raw.move_count
                    }
                });
            }
        } catch (e: any) {
            console.error("Wasm Init Error:", e);
            set({ error: "Failed to load Game Engine: " + e.message });
        }
    },

    resetGame: (startPlayer) => {
        if (!module) return;
        const { humanPlayer } = get();
        
        // If humanPlayer is 0 (Spectator), we pass 1 as default perspective for reset (or just 1 to start new game).
        const targetPlayer = startPlayer ?? (humanPlayer === 0 ? 1 : humanPlayer);
        
        module.reset_game(targetPlayer as number);
        
        const raw = module.get_state();
        if (raw) {
            set({
                aiValue: 0,
                error: null,
                gameState: {
                    pieces: raw.pieces,
                    tiles: raw.tiles,
                    tile_counts: raw.tile_counts,
                    current_player: raw.current_player as Player,
                    game_over: raw.game_over,
                    winner: raw.winner,
                    move_count: raw.move_count
                }
            });
        }

        // Auto-trigger if AI starts (e.g. human is P2)
        if (humanPlayer === 2 && !raw.game_over) {
             get().triggerAI();
        }
    },

    move: (from, to, tile) => {
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
            const raw = module.get_state();
            if (raw) {
                set({
                    error: null,
                    gameState: {
                        pieces: raw.pieces,
                        tiles: raw.tiles,
                        tile_counts: raw.tile_counts,
                        current_player: raw.current_player as Player,
                        game_over: raw.game_over,
                        winner: raw.winner,
                        move_count: raw.move_count
                    }
                });
            }
        } else {
            console.error("Move failed:", res.error);
            set({ error: res.error || "Illegal Move" });
        }
    },

    undo: () => {
        if (!module) return;
        const { humanPlayer } = get();

        let success = module.undo();
        if (success) {
            // Check if we need to undo further to reach target player's turn (Human vs AI)
            const raw = module.get_state();
            if (humanPlayer !== 0 && raw.current_player !== humanPlayer) {
                // Try undoing one more time to get back to Human turn
                module.undo();
            }

            const updated = module.get_state();
             if (updated) {
                set({
                    aiValue: 0,
                    error: null,
                    gameState: {
                        pieces: updated.pieces,
                        tiles: updated.tiles,
                        tile_counts: updated.tile_counts,
                        current_player: updated.current_player as Player,
                        game_over: updated.game_over,
                        winner: updated.winner,
                        move_count: updated.move_count
                    }
                });
            }
        }
    },

    triggerAI: async () => {
        if (!module) return;
        const { isThinking, simulationCount } = get();
        if (isThinking) return;

        set({ isThinking: true });

        // Use setTimeout to allow UI to render 'Thinking' state
        setTimeout(() => {
            try {
                if (!module) return;
                const res = module.ai_think(simulationCount);
                if (res && typeof res === 'object') {
                    if (res.action >= 0) {
                        module.step(res.action);
                        const raw = module.get_state();
                        if (raw) {
                            set({
                                aiValue: res.value,
                                gameState: {
                                    pieces: raw.pieces,
                                    tiles: raw.tiles,
                                    tile_counts: raw.tile_counts,
                                    current_player: raw.current_player as Player,
                                    game_over: raw.game_over,
                                    winner: raw.winner,
                                    move_count: raw.move_count
                                }
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("AI Error", e);
                set({ error: "AI processing failed" });
            } finally {
                set({ isThinking: false });
            }
        }, 50);
    },

    getValidMoves: (x, y) => {
        if (!module) return [];
        return module.get_valid_moves(x, y);
    }
}));
