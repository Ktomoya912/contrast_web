import Board from '@/components/Board';
import Controls from '@/components/Controls';
import EvaluationBar from '@/components/EvaluationBar';
import GameSettings from '@/components/GameSettings';
import PlayerResources from '@/components/PlayerResources';
import RulesModal from '@/components/RulesModal';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { useGameStore } from '@/store/useGameStore';
import { useEffect, useState } from 'react';

function AppContent() {
  const { t } = useLanguage();

  // Store
  const gameState = useGameStore(state => state.gameState);
  const humanPlayer = useGameStore(state => state.humanPlayer);
  const triggerAI = useGameStore(state => state.triggerAI);
  const isThinking = useGameStore(state => state.isThinking);
  const error = useGameStore(state => state.error);
  const isReady = useGameStore(state => state.isReady);
  const initialize = useGameStore(state => state.initialize);
  const resetGame = useGameStore(state => state.resetGame);
  const undo = useGameStore(state => state.undo);

  const [showRules, setShowRules] = useState(false);

  const opponentPlayer = humanPlayer === 1 ? 2 : 1;

  // Init Wasm
  useEffect(() => {
    initialize();
  }, [initialize]);

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
    resetGame();
  };

  const handleUndo = () => {
    undo();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-game-bg-dark w-full px-4 pt-24 md:pt-12 text-center pb-32 md:pb-0 overflow-hidden">

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

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowRules(true)}
            className="w-10 h-10 rounded-full bg-cyan-500/20 border-cyan-400/30 text-cyan-400 font-bold shrink-0 mx-2 hover:bg-cyan-500/30 hover:text-cyan-300"
            aria-label="Rules"
          >
            ?
          </Button>

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
              className="w-full"
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleUndo}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold"
          >
            {t.app.undo}
          </Button>
        </div>
      </div>

      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="mb-4 md:mb-8 text-center relative z-10 w-full max-w-4xl mx-auto hidden md:flex flex-col items-center">
        <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-1 md:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 drop-shadow-sm">
          CONTRAST
        </h1>
        <p className="text-game-text-muted text-xs md:text-lg font-light tracking-widest uppercase mb-4">
          {t.app.description}
        </p>

        <Button
          variant="outline"
          onClick={() => setShowRules(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-bold border-white/10 h-auto"
        >
          <span className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] text-black font-black">?</span>
          {t.app.howToPlay}
        </Button>
      </header>

      {!isReady && !error && (
        <Card className="mb-4 inline-flex items-center gap-3 px-4 py-2 text-cyan-400 animate-pulse text-sm md:text-base bg-white/5 border-white/10 backdrop-blur-md rounded-2xl mx-auto">
          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
          {t.app.loading}
        </Card>
      )}

      {error && (
        <Card className="mb-8 px-6 py-4 border-red-500/50 text-red-400 font-bold inline-flex flex-col items-center bg-white/5 backdrop-blur-md rounded-2xl mx-auto">
          <span className="text-2xl mb-2">⚠️</span>
          {error}
        </Card>
      )}

      <main className="flex-grow flex flex-col lg:flex-row gap-6 md:gap-12 items-center lg:items-start max-w-7xl w-full justify-center relative z-10 p-2 md:p-0 mx-auto">
        <div className="order-2 lg:order-1 touch-none">
          <Board />
        </div>

        <div className="order-1 lg:order-2 w-full lg:w-auto min-w-[300px] max-w-sm">
          {/* Desktop Controls (Full) */}
          <div className="hidden md:block">
            <Controls />
          </div>

          {/* Mobile Bottom Controls (Settings/Reset only) */}
          <Card className="md:hidden w-full mt-4 bg-white/5 border-white/10 backdrop-blur-md rounded-2xl">
            <CardHeader className="p-4 pb-2 border-b border-white/10">
              <CardTitle className="text-white font-bold text-sm">{t.app.settings}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">
              <Button
                onClick={handleReset}
                className="w-full py-6 bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white text-sm shadow-lg active:scale-95 h-auto border-0"
              >
                {t.app.newGame}
              </Button>

              <GameSettings />
            </CardContent>
          </Card>
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
