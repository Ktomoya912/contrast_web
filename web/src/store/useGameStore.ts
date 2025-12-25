import { type GameState, INITIAL_STATE, type Player } from '@/types';
import { create } from 'zustand';

// No WasmModule interface needed here anymore as it's hidden in store/worker

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
    getValidMoves: (x: number, y: number) => Promise<number[]>;
}

// Module instance replaced by Worker instance
let worker: Worker | null = null;

// Helper to handle async requests to worker (valid moves)
const requestQueue: Record<string, (data: any) => void> = {};

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
        if (worker) return; // Already initialized

        // Create Worker
        // Note: Vite handles new Worker(...) correctly with ?worker or standard syntax if constructor
        worker = new Worker(new URL('../workers/game.worker.ts', import.meta.url));

        // Setup Listener
        worker.onmessage = (e) => {
            const { type, payload, id } = e.data;
            switch (type) {
                case 'INIT_COMPLETE':
                    set({ isReady: true });
                    break;
                case 'STATE_UPDATE':
                    set({
                        gameState: payload.state,
                        aiValue: payload.aiValue || get().aiValue, // Keep old value if not sent? Or 0? Worker sends 0 by default on non-AI moves
                        error: null,
                        isThinking: false // Any state update implies logic done
                    });
                    break;
                case 'VALID_MOVES':
                    if (id && requestQueue[id]) {
                         requestQueue[id](payload);
                         delete requestQueue[id];
                    }
                    break;
                case 'ERROR':
                    set({ error: payload, isThinking: false });
                    break;
            }
        };

        // Send Init Message
        const baseUrl = import.meta.env.BASE_URL;
        worker.postMessage({ type: 'INIT', payload: { baseUrl } });
    },

    resetGame: (startPlayer) => {
        if (!worker) return;
        const { humanPlayer } = get();
        const targetPlayer = startPlayer ?? (humanPlayer === 0 ? 1 : humanPlayer);
        worker.postMessage({ type: 'RESET', payload: { humanPlayer: targetPlayer } });
        set({ aiValue: 0, error: null });
        
         // Auto-trigger handled by App effect or explicit logic?
         // App.tsx has effect: if (gameState.current_player === aiPlayer) triggerAI()
         // So when state updates from worker, App will trigger AI.
         // However, we might want to ensure we don't double trigger.
         // Let's rely on the Store state update triggering the App effect.
    },

    move: (from, to, tile) => {
        if (!worker) return;

        const move_idx = from * 25 + to;
        let tile_idx = 0;

        if (tile) {
            const t_loc = tile.y * 5 + tile.x;
            if (tile.type === 1) tile_idx = 1 + t_loc;
            else if (tile.type === 2) tile_idx = 26 + t_loc;
        }

        const hash = move_idx * 51 + tile_idx;
        
        // Optimistic check or just send? Just send.
        worker.postMessage({ type: 'MOVE', payload: { action: hash } });
    },

    undo: () => {
        if (!worker) return;
        worker.postMessage({ type: 'UNDO' });
    },

    triggerAI: async () => {
        if (!worker) return;
        const { isThinking, simulationCount } = get();
        if (isThinking) return;

        set({ isThinking: true });
        
        // Send AI Think command
        worker.postMessage({ type: 'AI_THINK', payload: { simulations: simulationCount } });
    },

    getValidMoves: async (x, y) => {
        if (!worker) return [];
        
        return new Promise<number[]>((resolve) => {
            const id = Math.random().toString(36).substring(7);
            requestQueue[id] = resolve;
            worker?.postMessage({ type: 'GET_VALID_MOVES', id, payload: { x, y } });
        });
    }
}));
