import { useEffect, useState } from 'react'
import Board from './components/Board'
import Controls from './components/Controls'
import { useGame } from './hooks/useGame'
import './index.css'

// Types
export type Player = 1 | 2;
export type TileType = 0 | 1 | 2; // White, Black, Gray

export interface GameState {
  pieces: number[]; // Flat 25
  tiles: number[]; // Flat 25
  tile_counts: number[]; // [P1_B, P1_G, P2_B, P2_G]
  current_player: Player;
  game_over: boolean;
  winner: number;
  move_count: number;
}

export const INITIAL_STATE: GameState = {
  pieces: Array(25).fill(0),
  tiles: Array(25).fill(0),
  tile_counts: [3, 1, 3, 1],
  current_player: 1,
  game_over: false,
  winner: 0,
  move_count: 0
};

function App() {
  const { gameState, aiValue, resetGame, move, undo, getValidMoves, triggerAI, isThinking, error, isReady, simulationCount, setSimulationCount } = useGame();
  const [humanPlayer, setHumanPlayer] = useState<Player>(1);

  // Auto-trigger AI if it's AI turn
  useEffect(() => {
    // If game is ready and not over
    if (isReady && !gameState.game_over && !isThinking) {
        // AI is the player that is NOT humanPlayer
        const aiPlayer = humanPlayer === 1 ? 2 : 1;
        if (gameState.current_player === aiPlayer) {
            triggerAI();
        }
    }
  }, [gameState.current_player, gameState.game_over, humanPlayer, isThinking, isReady, triggerAI]);

  const handleReset = () => {
      resetGame(humanPlayer);
  };

  const handleMove = (from: number, to: number, tile?: {type: number, x: number, y: number}) => {
      move(from, to, tile);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="mb-8 md:mb-12 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 drop-shadow-sm">
          CONTRAST
        </h1>
        <p className="text-game-text-muted text-lg font-light tracking-widest uppercase">
          Neural Architecture v1.0
        </p>
      </header>
      
      {!isReady && !error && (
          <div className="mb-8 flex items-center gap-3 glass-panel px-6 py-3 text-cyan-400 animate-pulse">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            Loading Neural Engine...
          </div>
      )}
      
      {error && (
          <div className="mb-8 glass-panel px-6 py-4 border-red-500/50 text-red-400 font-bold flex flex-col items-center">
            <span className="text-2xl mb-2">⚠️</span>
            {error}
          </div>
      )}
      
      <main className="flex flex-col lg:flex-row gap-12 items-center lg:items-start max-w-7xl w-full justify-center relative z-10">
        <div className="order-2 lg:order-1">
            <Board 
                gameState={gameState} 
                humanPlayer={humanPlayer}
                onMove={handleMove}
                getValidMoves={getValidMoves}
            />
        </div>
        
        <div className="order-1 lg:order-2 w-full lg:w-auto min-w-[320px]">
            <Controls 
                gameState={gameState}
                aiValue={aiValue}
                humanPlayer={humanPlayer}
                setHumanPlayer={setHumanPlayer}
                simulationCount={simulationCount}
                setSimulationCount={setSimulationCount}
                onReset={handleReset}
                onUndo={undo}
            />

            <div className="mt-8 glass-panel p-6 max-w-sm">
                <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                    <span className="text-2xl">⚡</span> Quick Guide
                </h2>
                <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">●</span> 
                        <span>Goal: Reach opponent's back rank.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">●</span> 
                        <span>Move based on tile color:</span>
                    </li>
                    <div className="grid grid-cols-3 gap-2 pl-4 mt-2 mb-2">
                         <div className="flex flex-col items-center p-2 rounded bg-white/5">
                            <span className="text-2xl mb-1">✜</span>
                            <span className="text-xs text-gray-400">Orthogonal</span>
                         </div>
                         <div className="flex flex-col items-center p-2 rounded bg-white/5">
                            <span className="text-2xl mb-1">✖</span>
                            <span className="text-xs text-gray-400">Diagonal</span>
                         </div>
                         <div className="flex flex-col items-center p-2 rounded bg-white/5">
                            <span className="text-2xl mb-1">✳</span>
                            <span className="text-xs text-gray-400">8-Way</span>
                         </div>
                    </div>
                </ul>
            </div>
        </div>
      </main>
      
      <footer className="mt-16 text-center text-gray-600 text-sm relative z-10">
        <p>Powered by AlphaZero &amp; WebAssembly</p>
      </footer>
    </div>
  )
}

export default App
