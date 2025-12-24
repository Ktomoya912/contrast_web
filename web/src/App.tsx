import { useEffect, useState } from 'react';
import Board from './components/Board';
import Controls from './components/Controls';
import EvaluationBar from './components/EvaluationBar';
import GameSettings from './components/GameSettings';
import PlayerResources from './components/PlayerResources';
import RulesModal from './components/RulesModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useGame } from './hooks/useGame';
import './index.css';
import { type Player } from './types';

function AppContent() {
  const { t } = useLanguage();
  const { gameState, aiValue, resetGame, move, undo, getValidMoves, triggerAI, isThinking, error, isReady, simulationCount, setSimulationCount } = useGame();
  const [humanPlayer, setHumanPlayer] = useState<Player>(1);
  const [showRules, setShowRules] = useState(false);
  
  const opponentPlayer = humanPlayer === 1 ? 2 : 1;

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

  const handleUndo = () => {
      undo(humanPlayer);
  };

  return (

     <div className="min-h-[100dvh] flex flex-col relative bg-game-bg-dark w-full px-4 pt-8 md:pt-12 text-center pb-0 overflow-hidden">

       {/* ... */}
       

       {/* Mobile Fixed Top: Both Resources */}
       <div className="md:hidden fixed top-0 left-0 w-full max-w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-2 py-2 flex flex-col gap-2 shadow-xl">
            <div className="flex justify-between items-center w-full">
                 <PlayerResources 
                         tileCounts={gameState.tile_counts} 
                         targetPlayer={opponentPlayer} 
                         label={t.app.opponent}
                         compact={true}
                         className="scale-90 origin-left"
                 />
                 
                 <button 
                         onClick={() => setShowRules(true)}
                         className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold shrink-0 mx-2 active:scale-95 transition-transform"
                         aria-label="Rules"
                 >
                     ?
                 </button>
 
                 <PlayerResources 
                         tileCounts={gameState.tile_counts} 
                         targetPlayer={humanPlayer} 
                         label={t.app.you}
                         compact={true}
                         className="scale-90 origin-right"
                 />
            </div>
       </div>
 
        {/* Mobile Fixed Bottom: Eval + Undo */}
        <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-slate-900/95 backdrop-blur border-t border-white/10 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
            <div className="flex justify-between items-center w-full">
                <div className="flex-1 mr-4 min-w-0">
                     <EvaluationBar 
                             aiValue={aiValue}
                             humanPlayer={humanPlayer}
                             className="w-full"
                     />
                </div>
                <button 
                     onClick={handleUndo}
                     className="px-4 py-2 bg-gray-700 rounded-lg text-xs font-bold text-gray-300 border border-gray-600 active:scale-95 shrink-0"
                >
                    {t.app.undo}
                </button>
            </div>
        </div>
 
       <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
       <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
 
       <header className="mb-4 md:mb-8 text-center relative z-10 w-full max-w-4xl mx-auto hidden md:flex flex-col items-center">
         {/* Desktop Header content */}
         <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-1 md:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 drop-shadow-sm">
           CONTRAST
         </h1>
         <p className="text-game-text-muted text-xs md:text-lg font-light tracking-widest uppercase mb-4">
           {t.app.description}
         </p>
 
         <button 
             onClick={() => setShowRules(true)}
             className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-bold transition-all border border-white/10"
         >
             <span className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] text-black font-black">?</span>
             {t.app.howToPlay}
         </button>
       </header>
       
       {!isReady && !error && (
           <div className="mb-4 flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl px-4 py-2 text-cyan-400 animate-pulse text-sm md:text-base">
             <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
             {t.app.loading}
           </div>
       )}
       
       {error && (
           <div className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl px-6 py-4 border-red-500/50 text-red-400 font-bold flex flex-col items-center">
             <span className="text-2xl mb-2">⚠️</span>
             {error}
           </div>
       )}
       
       <main className="flex-grow flex flex-col lg:flex-row gap-6 md:gap-12 items-center lg:items-start max-w-7xl w-full justify-center relative z-10 p-2 md:p-0 mx-auto">
         {/* ... content ... */}
         <div className="order-2 lg:order-1 touch-none"> 
             <Board 
                 gameState={gameState} 
                 humanPlayer={humanPlayer}
                 onMove={handleMove}
                 getValidMoves={getValidMoves}
             />
         </div>
         
         <div className="order-1 lg:order-2 w-full lg:w-auto min-w-[300px] max-w-sm">
             {/* Desktop Controls (Full) */}
             <div className="hidden md:block">
                 <Controls 
                     gameState={gameState}
                     aiValue={aiValue}
                     humanPlayer={humanPlayer}
                     setHumanPlayer={setHumanPlayer}
                     simulationCount={simulationCount}
                     setSimulationCount={setSimulationCount}
                     onReset={handleReset}
                     onUndo={handleUndo}
                 />
             </div>
             
             {/* Mobile Bottom Controls (Settings/Reset only) */}
             <div className="md:hidden w-full mt-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl p-4">
                 <h3 className="text-white font-bold mb-3 text-sm border-b border-white/10 pb-2">{t.app.settings}</h3>
                 <div className="flex flex-col gap-4">
                      <button 
                         onClick={handleReset}
                         className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg font-bold text-white text-sm shadow-lg active:scale-95 transition-all"
                      >
                         {t.app.newGame}
                      </button>
                      
                      <GameSettings
                         humanPlayer={humanPlayer}
                         setHumanPlayer={setHumanPlayer}
                         simulationCount={simulationCount}
                         setSimulationCount={setSimulationCount}
                      />
                 </div>
             </div>
         </div>
      </main>

      
      <footer className="mt-auto text-center text-gray-600 text-xs md:text-sm relative z-10 p-4 w-full">
        <p>Powered by AlphaZero &amp; WebAssembly</p>
      </footer>
      
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
