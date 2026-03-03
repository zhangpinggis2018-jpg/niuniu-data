import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Timer, 
  Zap, 
  Settings2, 
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Block, GameMode, GRID_COLS, GRID_ROWS, INITIAL_ROWS, TARGET_MIN, TARGET_MAX, TIME_MODE_INTERVAL } from './types';

// Utility to generate a random block
const createBlock = (row: number, col: number): Block => ({
  id: Math.random().toString(36).substring(2, 9),
  value: Math.floor(Math.random() * 9) + 1,
  row,
  col,
  isSelected: false,
});

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [target, setTarget] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(TIME_MODE_INTERVAL);
  const [combo, setCombo] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game
  const initGame = (selectedMode: GameMode) => {
    const initialBlocks: Block[] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialBlocks.push(createBlock(GRID_ROWS - 1 - r, c));
      }
    }
    setBlocks(initialBlocks);
    setTarget(generateTarget());
    setScore(0);
    setCombo(0);
    setMode(selectedMode);
    setGameState('playing');
    setTimeLeft(TIME_MODE_INTERVAL);
  };

  const generateTarget = () => Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)) + TARGET_MIN;

  const addRow = useCallback(() => {
    setBlocks(prev => {
      // Move existing blocks up
      const movedBlocks = prev.map(b => ({ ...b, row: b.row - 1 }));
      
      // Check for game over (any block reaches row -1 or row 0 is full)
      if (movedBlocks.some(b => b.row < 0)) {
        setGameState('gameover');
        return prev;
      }

      // Add new row at the bottom (row GRID_ROWS - 1)
      const newRow: Block[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        newRow.push(createBlock(GRID_ROWS - 1, c));
      }
      
      return [...movedBlocks, ...newRow];
    });
    setTimeLeft(TIME_MODE_INTERVAL);
  }, []);

  // Time mode loop
  useEffect(() => {
    if (gameState === 'playing' && mode === 'time') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 100) {
            addRow();
            return TIME_MODE_INTERVAL;
          }
          return prev - 100;
        });
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, mode, addRow]);

  const handleBlockClick = (id: string) => {
    if (gameState !== 'playing') return;

    setBlocks(prev => {
      const newBlocks = prev.map(b => b.id === id ? { ...b, isSelected: !b.isSelected } : b);
      const selected = newBlocks.filter(b => b.isSelected);
      const currentSum = selected.reduce((acc, b) => acc + b.value, 0);

      if (currentSum === target) {
        // Match!
        const remaining = newBlocks.filter(b => !b.isSelected);
        
        // Update score with combo
        const points = target * (selected.length) * (1 + combo * 0.1);
        setScore(s => s + Math.floor(points));
        setCombo(c => c + 1);
        setTarget(generateTarget());
        
        // In classic mode, matching adds a row
        if (mode === 'classic') {
          // We need to handle the state update carefully to add row after removal
          setTimeout(() => addRow(), 100);
        } else {
          // In time mode, matching resets the timer slightly or just rewards points
          setTimeLeft(prev => Math.min(TIME_MODE_INTERVAL, prev + 1000));
        }

        return remaining;
      } else if (currentSum > target) {
        // Exceeded target, deselect all
        setCombo(0);
        return newBlocks.map(b => ({ ...b, isSelected: false }));
      }
      
      return newBlocks;
    });
  };

  const currentSum = blocks.filter(b => b.isSelected).reduce((acc, b) => acc + b.value, 0);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div className="game-container bg-[#b8b3a8] text-[#1a1a1a] font-sans selection:bg-[#7a261d]/30 relative overflow-hidden">
      {/* Decorative Mountain Background */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none z-0">
        <img 
          src="https://picsum.photos/seed/mountains/1200/400?grayscale&blur=1" 
          alt="Mountains" 
          className="w-full h-full object-cover mountain-bg opacity-30"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* HUD */}
      {gameState === 'playing' && (
        <div className="w-full max-w-md px-6 pt-8 pb-4 flex flex-col gap-4 z-10">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold mb-1">得分</p>
              <p className="text-3xl font-serif font-bold text-[#1a1a1a] leading-none">{score.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold mb-1">目标值</p>
              <div className="flex items-center gap-2">
                <div className="px-5 py-2 bg-[#7a261d] border-2 border-[#5a1c15] rounded-sm shadow-lg transform rotate-1">
                  <span className="text-3xl font-serif font-bold text-[#b8b3a8]">{target}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-0.5 bg-zinc-900/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#1a1a1a]"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentSum / target) * 100}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              />
            </div>
            <div className="text-[10px] font-mono font-bold text-zinc-600 w-12 text-right">
              {currentSum}/{target}
            </div>
          </div>

          {mode === 'time' && (
            <div className="w-full h-0.5 bg-zinc-900/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#7a261d]"
                animate={{ width: `${(timeLeft / TIME_MODE_INTERVAL) * 100}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Game Area */}
      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-4 z-10">
        <AnimatePresence mode="wait">
          {gameState === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white/20 border border-white/30 p-8 rounded-3xl backdrop-blur-xl shadow-2xl shadow-zinc-900/10"
            >
              <div className="mb-8 text-center">
                <div className="inline-flex p-4 bg-[#8c2f26]/5 rounded-full mb-4 border border-[#8c2f26]/10">
                  <Zap className="w-8 h-8 text-[#8c2f26]" />
                </div>
                <h1 className="text-4xl font-serif font-bold tracking-tight mb-2 text-[#1a1a1a]">数字消除</h1>
                <p className="text-zinc-600 text-sm italic font-serif">墨香盈袖 · 数里乾坤</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => initGame('classic')}
                  className="w-full group flex items-center justify-between p-4 bg-[#1a1a1a] text-[#b8b3a8] rounded-xl font-bold transition-all hover:bg-[#000000] active:scale-[0.98] shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5" />
                    <span className="font-serif">经典模式</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button 
                  onClick={() => initGame('time')}
                  className="w-full group flex items-center justify-between p-4 bg-white/20 border border-zinc-900/10 text-[#1a1a1a] rounded-xl font-bold transition-all hover:bg-white/40 active:scale-[0.98] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-[#7a261d]" />
                    <span className="font-serif">计时挑战</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-300 flex justify-between items-center text-zinc-500">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">最高分: {highScore}</span>
                </div>
                <button className="p-2 hover:bg-white/30 rounded-lg transition-colors">
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-6 gap-2 w-full aspect-[6/10] bg-white/10 p-2 rounded-2xl border border-white/20 relative overflow-hidden shadow-inner"
            >
              {/* Grid Background Lines */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-10 pointer-events-none opacity-5">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-[#1a1a1a]" />
                ))}
              </div>

              {/* Blocks */}
              <AnimatePresence>
                {blocks.map((block) => (
                  <motion.button
                    key={block.id}
                    layoutId={block.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      gridRowStart: block.row + 1,
                      gridColumnStart: block.col + 1,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={() => handleBlockClick(block.id)}
                    className={`
                      relative flex items-center justify-center rounded-lg text-xl font-serif font-bold transition-all block-shanshui
                      ${block.isSelected 
                        ? 'block-shanshui-selected scale-105 z-10' 
                        : 'text-[#1a1a1a] hover:bg-zinc-300/50 active:scale-95'
                      }
                    `}
                    style={{
                      gridRow: block.row + 1,
                      gridColumn: block.col + 1,
                    }}
                  >
                    {block.value}
                  </motion.button>
                ))}
              </AnimatePresence>

              {/* Danger Zone Indicator */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#8c2f26]/10" />
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-white/40 border border-[#8c2f26]/20 p-8 rounded-3xl text-center backdrop-blur-xl shadow-2xl"
            >
              <div className="inline-flex p-4 bg-[#8c2f26]/5 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-[#8c2f26]" />
              </div>
              <h2 className="text-3xl font-serif font-bold tracking-tight mb-2 text-[#1a1a1a]">游戏结束</h2>
              <p className="text-zinc-600 text-sm mb-8 italic font-serif">青山依旧在，几度夕阳红</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-white/30 rounded-xl border border-white/50">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">最终得分</p>
                  <p className="text-2xl font-serif font-bold">{score}</p>
                </div>
                <div className="p-4 bg-white/30 rounded-xl border border-white/50">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">最高分</p>
                  <p className="text-2xl font-serif font-bold text-[#8c2f26]">{highScore}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => initGame(mode)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-[#1a1a1a] text-[#b8b3a8] rounded-xl font-bold transition-all hover:bg-[#000000] active:scale-[0.98] shadow-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="font-serif">重整旗鼓</span>
                </button>
                <button 
                  onClick={() => setGameState('menu')}
                  className="w-full p-4 bg-white/40 border border-zinc-300 text-[#1a1a1a] rounded-xl font-bold transition-all hover:bg-white/60 active:scale-[0.98]"
                >
                  <span className="font-serif">返回主页</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Controls Hint */}
      {gameState === 'playing' && (
        <div className="w-full max-w-md px-6 pb-8 flex justify-between items-center text-zinc-700 z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7a261d] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-serif">
              {mode === 'classic' ? '生存模式' : '计时挑战'}
            </span>
          </div>
          <button 
            onClick={() => setGameState('menu')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
