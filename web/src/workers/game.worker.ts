/* eslint-disable no-restricted-globals */

// Define the Wasm module interface (simplified for worker)
interface WasmModule {
    init_game: (model_path: string) => void;
    reset_game: (human_player: number) => void;
    get_state: () => any;
    get_valid_moves: (x: number, y: number) => any; // Returns vector or array
    step: (action: number) => { success: boolean, game_over: boolean, winner: number, error?: string };
    undo: () => boolean;
    ai_think: (sims: number) => { action: number, value: number };
    decode_action: (hash: number) => any;
    FS: any;
}

// Global scope for the worker to access importScripts stuff
declare global {
    function importScripts(...urls: string[]): void;
    var ContrastModule: any;
}

let module: WasmModule | null = null;

const ctx: Worker = self as any;

// Initial state definition removed (unused)

// Handle Messages from Main Thread
ctx.onmessage = async (e: MessageEvent) => {
    const { type, payload, id } = e.data;

    try {
        switch (type) {
            case 'INIT':
                await initialize(payload.baseUrl);
                postState();
                ctx.postMessage({ type: 'INIT_COMPLETE' });
                break;

            case 'RESET':
                if (!module) throw new Error("Module not initialized");
                module.reset_game(payload.humanPlayer); // 0 or 1 or 2
                postState();
                break;

            case 'MOVE':
                if (!module) throw new Error("Module not initialized");
                const res = module.step(payload.action);
                if (!res.success) {
                    ctx.postMessage({ type: 'ERROR', payload: res.error || "Illegal Move" });
                } else {
                    postState();
                }
                break;

            case 'UNDO':
                if (!module) throw new Error("Module not initialized");
                const steps = payload?.steps || 1;
                for (let i = 0; i < steps; i++) {
                    module.undo();
                }
                postState();
                break;

            case 'AI_THINK':
                if (!module) throw new Error("Module not initialized");
                // This is the heavy operation that blocks, now it runs here
                const aiRes = module.ai_think(payload.simulations);
                if (aiRes && aiRes.action >= 0) {
                    // Apply the move immediately in the worker state
                    module.step(aiRes.action);
                    postState(aiRes.value); // Send back value too
                }
                break;

            case 'GET_VALID_MOVES':
                if (!module) {
                    ctx.postMessage({ type: 'VALID_MOVES', id, payload: [] });
                    return;
                }
                const moves = module.get_valid_moves(payload.x, payload.y);
                // Convert WASM vector to array if needed (Embind usually returns vector object)
                // Assuming get_valid_moves returns a JS array or compatible vector
                // If it returns a vector, we might need code to convert it.
                // Assuming Embind returns a specialized vector object that is iterable or has .get(i)
                // Let's assume it returns a vector and convert it safely.
                const movesArray = [];
                if (moves && typeof moves.size === 'number') {
                    for(let i=0; i<moves.size(); i++) {
                        movesArray.push(moves.get(i));
                    }
                    moves.delete(); // Important: delete C++ vector!!!
                } else if (Array.isArray(moves)) {
                     movesArray.push(...moves);
                }
                
                ctx.postMessage({ type: 'VALID_MOVES', id, payload: movesArray });
                break;
                
            default:
                console.warn("Unknown worker message:", type);
        }
    } catch (err: any) {
        console.error("Worker Error:", err);
        ctx.postMessage({ type: 'ERROR', payload: err.message });
    }
};

async function initialize(baseUrl: string) {
    if (module) return;

    // Load the glue code
    // Depending on build, contrast.js might be in public root
    // Worker URL is relative to the worker script location? 
    // Or we use absolute path from origin.
    // 'importScripts' works relative to the worker file location usually, or absolute.
    // Best to use absolute path from root if we serve it there.
    // In Vite dev, public folder is at /
    
    // We pass baseUrl from main thread to be safe
    const scriptUrl = `${baseUrl}contrast.js`.replace('//', '/');
    importScripts(scriptUrl);

    if (!self.ContrastModule) {
        throw new Error("Failed to load contrast.js");
    }

    const mod = await self.ContrastModule({
        locateFile: (path: string, prefix: string) => {
            if (path.endsWith('.wasm')) {
                // Return absolute URL to the Wasm file
                return `${baseUrl}${path}`.replace('//', '/');
            }
            return prefix + path;
        }
    });
    
    // Fetch model
    const modelUrl = `${baseUrl}model.bin`.replace('//', '/');
    const response = await fetch(modelUrl);
    if (!response.ok) throw new Error(`Failed to fetch model.bin`);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);

    mod.FS.writeFile('/model.bin', data);
    mod.init_game('/model.bin');

    module = mod;
    console.log("Worker: Module Initialized");
}

function postState(aiValue: number = 0) {
    if (!module) return;
    const raw = module.get_state();
    
    // Make sure we send a clean JS object
    const state = {
        pieces: Array.from(raw.pieces as Uint8Array), // Convert TypedArray/Vector
        tiles: Array.from(raw.tiles as Uint8Array),
        tile_counts: Array.from(raw.tile_counts as Uint8Array), // Assuming these are arrays/vectors
        current_player: raw.current_player,
        game_over: raw.game_over,
        winner: raw.winner,
        move_count: raw.move_count
    };

    ctx.postMessage({ type: 'STATE_UPDATE', payload: { state, aiValue } });
}
