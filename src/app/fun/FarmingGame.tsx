'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

interface FarmingGameProps {
  onBack: () => void;
}

// --- Constants & Config ---
const GRID_COLS = 4;
const GRID_ROWS = 3;
const TILE_SIZE = 100;
const TILE_GAP = 20;
const CANVAS_WIDTH = GRID_COLS * (TILE_SIZE + TILE_GAP) + TILE_GAP;
const CANVAS_HEIGHT = GRID_ROWS * (TILE_SIZE + TILE_GAP) + TILE_GAP + 100; // Extra space for char

type CropType = 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin' | 'golden_tree';

interface CropDef {
  id: CropType;
  name: string;
  emoji: string;
  cost: number;
  sellPrice: number;
  growTime: number; // in seconds
  color: string;
}

const CROPS: Record<CropType, CropDef> = {
  wheat: { id: 'wheat', name: '밀', emoji: '🌾', cost: 10, sellPrice: 15, growTime: 5, color: '#fef3c7' },
  corn: { id: 'corn', name: '옥수수', emoji: '🌽', cost: 50, sellPrice: 80, growTime: 15, color: '#fde047' },
  carrot: { id: 'carrot', name: '당근', emoji: '🥕', cost: 150, sellPrice: 250, growTime: 30, color: '#fb923c' },
  tomato: { id: 'tomato', name: '토마토', emoji: '🍅', cost: 500, sellPrice: 900, growTime: 60, color: '#f87171' },
  pumpkin: { id: 'pumpkin', name: '호박', emoji: '🎃', cost: 2000, sellPrice: 4000, growTime: 120, color: '#ea580c' },
  golden_tree: { id: 'golden_tree', name: '황금나무', emoji: '🌳', cost: 100000, sellPrice: 250000, growTime: 600, color: '#fbbf24' },
};

const INITIAL_PLOTS = 2;
const PLOT_BASE_PRICE = 500;

// --- Types ---
interface Plot {
  index: number;
  x: number;
  y: number;
  isUnlocked: boolean;
  crop: {
    type: CropType;
    plantedAt: number; // timestamp
  } | null;
}

interface GameState {
  gold: number;
  plots: Plot[];
}

interface Character {
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  action: 'idle' | 'walking' | 'watering' | 'harvesting';
  actionTargetIndex: number | null; // which plot
}

export default function FarmingGame({ onBack }: FarmingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // -- Game State --
  const [gold, setGold] = useState(50);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotIndex, setSelectedPlotIndex] = useState<number | null>(null);

  // Character Ref (for animation loop)
  const charRef = useRef<Character>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    targetX: null,
    targetY: null,
    action: 'idle',
    actionTargetIndex: null,
  });

  // Loop Refs
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const stateRef = useRef<{ plots: Plot[], gold: number }>({ plots: [], gold: 50 }); // For sync in loop

  // -- Initialization & Persistence --
  useEffect(() => {
    // Initialize Grid
    const initialPlots: Plot[] = [];
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      initialPlots.push({
        index: i,
        x: TILE_GAP + col * (TILE_SIZE + TILE_GAP),
        y: TILE_GAP + row * (TILE_SIZE + TILE_GAP),
        isUnlocked: i < INITIAL_PLOTS,
        crop: null
      });
    }

    // Load from LocalStorage
    const saved = localStorage.getItem('farming_save_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGold(parsed.gold);
        // Merge saved plots with grid config (in case config changed, simplistic merge)
        const mergedPlots = initialPlots.map((p, idx) => {
          if (parsed.plots[idx]) {
            return { ...p, isUnlocked: parsed.plots[idx].isUnlocked, crop: parsed.plots[idx].crop };
          }
          return p;
        });
        setPlots(mergedPlots);
        stateRef.current = { gold: parsed.gold, plots: mergedPlots };
      } catch (e) {
        console.error("Failed to load save", e);
        setPlots(initialPlots);
        stateRef.current = { gold: 50, plots: initialPlots };
      }
    } else {
      setPlots(initialPlots);
      stateRef.current = { gold: 50, plots: initialPlots };
    }

    lastTimeRef.current = performance.now();
    gameLoop();

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // Sync stateRef when React state changes (for interactions)
  useEffect(() => {
    stateRef.current.gold = gold;
    stateRef.current.plots = plots;
    saveGame();
  }, [gold, plots]);

  const saveGame = () => {
    const data = {
      gold,
      plots
    };
    localStorage.setItem('farming_save_v1', JSON.stringify(data));
  };

  // -- Logic --

  const handlePlotClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked plot
    const clickedPlot = plots.find(p =>
      clickX >= p.x && clickX <= p.x + TILE_SIZE &&
      clickY >= p.y && clickY <= p.y + TILE_SIZE
    );

    if (clickedPlot) {
      setSelectedPlotIndex(clickedPlot.index);
    } else {
      setSelectedPlotIndex(null);
    }
  };

  const buyPlot = (index: number) => {
    const plot = plots[index];
    if (plot.isUnlocked) return;

    // Calculate dynamic price based on unlocked count
    const unlockedCount = plots.filter(p => p.isUnlocked).length;
    const price = PLOT_BASE_PRICE * Math.pow(1.5, unlockedCount - INITIAL_PLOTS);

    if (gold >= price) {
      setGold(g => g - price);
      setPlots(prev => {
        const newPlots = [...prev];
        newPlots[index] = { ...newPlots[index], isUnlocked: true };
        return newPlots;
      });
      setSelectedPlotIndex(null);
    } else {
      alert("골드가 부족합니다!");
    }
  };

  const plantCrop = (index: number, cropId: CropType) => {
    const cropDef = CROPS[cropId];
    if (gold < cropDef.cost) {
      alert("골드가 부족합니다!");
      return;
    }

    setGold(g => g - cropDef.cost);
    setSelectedPlotIndex(null); // Close menu

    // Command Character
    const plot = plots[index];
    const char = charRef.current;
    char.action = 'walking';
    char.targetX = plot.x + TILE_SIZE / 2;
    char.targetY = plot.y + TILE_SIZE / 2;
    char.actionTargetIndex = index;

    // We defer the actual planting until character arrives
    // But for UI responsiveness, we can mark it 'reserved' or handle in loop?
    // Let's handle it in the loop: when char arrives -> execute action.
    // To pass data to the loop, we might need a pendingAction ref.
  };

  // Since passing 'cropId' to the loop is tricky with just 'actionTargetIndex',
  // let's cheat a bit: Update state immediately (magic planting) OR store pending action.
  // Let's do: Character walks there, THEN we see the plant.
  // We need a ref for the pending operation.
  const pendingOpRef = useRef<{ type: 'plant' | 'harvest', payload?: any } | null>(null);

  const triggerPlant = (index: number, cropId: CropType) => {
    const cropDef = CROPS[cropId];
    if (gold < cropDef.cost) {
      alert("골드가 부족합니다!");
      return;
    }

    setGold(g => g - cropDef.cost);
    setSelectedPlotIndex(null);

    const plot = plots[index];
    charRef.current.targetX = plot.x + TILE_SIZE / 2;
    charRef.current.targetY = plot.y + TILE_SIZE / 2;
    charRef.current.action = 'walking';
    charRef.current.actionTargetIndex = index;

    pendingOpRef.current = { type: 'plant', payload: cropId };
  };

  const triggerHarvest = (index: number) => {
    const plot = plots[index];
    if (!plot.crop) return;

    // Check if fully grown
    const def = CROPS[plot.crop.type];
    const age = (Date.now() - plot.crop.plantedAt) / 1000;
    if (age < def.growTime) {
      alert("아직 다 자라지 않았습니다!");
      return;
    }

    setSelectedPlotIndex(null);

    charRef.current.targetX = plot.x + TILE_SIZE / 2;
    charRef.current.targetY = plot.y + TILE_SIZE / 2;
    charRef.current.action = 'walking';
    charRef.current.actionTargetIndex = index;

    pendingOpRef.current = { type: 'harvest' };
  };


  // -- Game Loop --
  const gameLoop = () => {
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = now;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const char = charRef.current;

    // 1. Update Character
    if (char.action === 'walking' && char.targetX !== null && char.targetY !== null) {
      const dx = char.targetX - char.x;
      const dy = char.targetY - char.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const speed = 300 * dt;

      if (dist < speed) {
        // Arrived
        char.x = char.targetX;
        char.y = char.targetY;
        char.targetX = null;
        char.targetY = null;

        // Execute Action
        if (char.actionTargetIndex !== null && pendingOpRef.current) {
          const idx = char.actionTargetIndex;

          if (pendingOpRef.current.type === 'plant') {
            const cropType = pendingOpRef.current.payload as CropType;
            // Update State via Ref then sync to React
            const newPlots = [...stateRef.current.plots];
            newPlots[idx] = {
              ...newPlots[idx],
              crop: { type: cropType, plantedAt: Date.now() }
            };
            setPlots(newPlots); // Trigger React update
          } else if (pendingOpRef.current.type === 'harvest') {
            const p = stateRef.current.plots[idx];
            if (p.crop) {
              const def = CROPS[p.crop.type];
              setGold(g => g + def.sellPrice); // Trigger React update
              const newPlots = [...stateRef.current.plots];
              newPlots[idx] = { ...newPlots[idx], crop: null };
              setPlots(newPlots);
            }
          }
        }

        char.action = 'idle';
        char.actionTargetIndex = null;
        pendingOpRef.current = null;
      } else {
        // Move
        char.x += (dx / dist) * speed;
        char.y += (dy / dist) * speed;
      }
    }

    // 2. Draw
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#a3e635'; // Grass green
    ctx.fillRect(0, 0, width, height);

    // Plots
    stateRef.current.plots.forEach(plot => {
      // Base
      if (plot.isUnlocked) {
        ctx.fillStyle = '#78350f'; // Soil brown
        ctx.fillRect(plot.x, plot.y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 4;
        ctx.strokeRect(plot.x, plot.y, TILE_SIZE, TILE_SIZE);

        // Crop
        if (plot.crop) {
          const def = CROPS[plot.crop.type];
          const age = (Date.now() - plot.crop.plantedAt) / 1000;
          const progress = Math.min(age / def.growTime, 1);

          // Growth bar
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(plot.x + 5, plot.y + TILE_SIZE - 10, (TILE_SIZE - 10) * progress, 5);

          // Plant visual
          const size = 20 + (progress * 40); // 20px to 60px
          ctx.font = `${size}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Wobble effect if growing
          const wobble = progress < 1 ? Math.sin(now / 200) * 5 : 0;

          ctx.save();
          ctx.translate(plot.x + TILE_SIZE/2, plot.y + TILE_SIZE/2);
          ctx.rotate(wobble * Math.PI / 180);
          ctx.fillText(def.emoji, 0, 0);
          ctx.restore();

          // Harvest ready indicator
          if (progress >= 1) {
             ctx.fillStyle = '#ef4444'; // Red attention
             ctx.beginPath();
             ctx.arc(plot.x + TILE_SIZE - 15, plot.y + 15, 10, 0, Math.PI * 2);
             ctx.fill();
             ctx.fillStyle = 'white';
             ctx.font = '12px Arial';
             ctx.fillText('!', plot.x + TILE_SIZE - 15, plot.y + 15);
          }

        } else {
          // Empty soil texture lines
          ctx.strokeStyle = '#5c2b0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(plot.x + 10, plot.y + 20); ctx.lineTo(plot.x + 90, plot.y + 20);
          ctx.moveTo(plot.x + 10, plot.y + 50); ctx.lineTo(plot.x + 90, plot.y + 50);
          ctx.moveTo(plot.x + 10, plot.y + 80); ctx.lineTo(plot.x + 90, plot.y + 80);
          ctx.stroke();
        }

      } else {
        // Locked
        ctx.fillStyle = '#1f2937'; // Gray
        ctx.fillRect(plot.x, plot.y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#6b7280';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', plot.x + TILE_SIZE/2, plot.y + TILE_SIZE/2);
      }
    });

    // Character
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Bounce animation when walking
    const bounce = char.action === 'walking' ? Math.abs(Math.sin(now / 100)) * 10 : 0;

    // Flip if moving left
    ctx.save();
    ctx.translate(char.x, char.y - bounce);
    if (char.targetX !== null && char.targetX < char.x) {
      ctx.scale(-1, 1);
    }
    ctx.fillText('🧑‍🌾', 0, 0);
    ctx.restore();

    ctx.shadowColor = 'transparent';

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };


  // -- Render UI Helpers --
  const getUnlockPrice = () => {
    const unlockedCount = plots.filter(p => p.isUnlocked).length;
    return PLOT_BASE_PRICE * Math.pow(1.5, unlockedCount - INITIAL_PLOTS);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-green-50 flex flex-col items-center justify-center font-sans">

      {/* Header HUD */}
      <div className="fixed top-20 left-0 right-0 z-10 flex justify-center pointer-events-none">
         <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border-2 border-yellow-400 flex items-center gap-4 pointer-events-auto">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-yellow-700">{Math.floor(gold).toLocaleString()} G</span>
            <Button size="sm" variant="outline" onClick={onBack} className="ml-4 h-8 text-xs">
              나가기
            </Button>
         </div>
      </div>

      <div className="relative mt-8">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handlePlotClick}
          className="cursor-pointer rounded-xl shadow-2xl bg-[#a3e635]"
          style={{ maxWidth: '100%', height: 'auto' }}
        />

        {/* Interaction Modal / Popover */}
        {selectedPlotIndex !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-green-500 w-80 pointer-events-auto animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {plots[selectedPlotIndex].isUnlocked ?
                    (plots[selectedPlotIndex].crop ? '작물 관리' : '씨앗 심기') :
                    '땅 구매'}
                </h3>
                <button
                  onClick={() => setSelectedPlotIndex(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {!plots[selectedPlotIndex].isUnlocked ? (
                <div className="text-center">
                   <p className="text-gray-600 mb-4">새로운 땅을 개간하시겠습니까?</p>
                   <p className="text-yellow-600 font-bold text-xl mb-4">{Math.floor(getUnlockPrice()).toLocaleString()} G</p>
                   <Button
                      onClick={() => buyPlot(selectedPlotIndex!)}
                      className="w-full bg-green-600 hover:bg-green-700"
                   >
                     구매하기
                   </Button>
                </div>
              ) : (
                <>
                  {plots[selectedPlotIndex].crop ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">{CROPS[plots[selectedPlotIndex].crop!.type].emoji}</div>
                      <p className="font-bold text-gray-800 mb-1">{CROPS[plots[selectedPlotIndex].crop!.type].name}</p>

                      {(() => {
                        const crop = plots[selectedPlotIndex].crop!;
                        const def = CROPS[crop.type];
                        const age = (Date.now() - crop.plantedAt) / 1000;
                        const timeLeft = Math.max(0, def.growTime - age);
                        const isReady = timeLeft <= 0;

                        return (
                          <div className="mb-4">
                            {isReady ? (
                              <p className="text-green-600 font-bold">수확 가능!</p>
                            ) : (
                              <p className="text-gray-500 text-sm">{Math.ceil(timeLeft)}초 남음</p>
                            )}
                            <p className="text-sm text-yellow-600 mt-1">판매가: {def.sellPrice} G</p>
                          </div>
                        );
                      })()}

                      <Button
                        onClick={() => triggerHarvest(selectedPlotIndex!)}
                        disabled={!plots[selectedPlotIndex].crop || (Date.now() - plots[selectedPlotIndex].crop!.plantedAt) / 1000 < CROPS[plots[selectedPlotIndex].crop!.type].growTime}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
                      >
                        수확하기 🧺
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {Object.values(CROPS).map(crop => (
                        <button
                          key={crop.id}
                          onClick={() => triggerPlant(selectedPlotIndex!, crop.id)}
                          disabled={gold < crop.cost}
                          className="flex flex-col items-center p-2 border rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:bg-gray-100 transition-colors"
                        >
                          <span className="text-2xl mb-1">{crop.emoji}</span>
                          <span className="font-bold text-sm text-gray-800">{crop.name}</span>
                          <span className="text-xs text-yellow-600">{crop.cost} G</span>
                          <span className="text-[10px] text-gray-400">{crop.growTime}초</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="mt-8 text-center text-green-800 max-w-md bg-white/50 p-4 rounded-xl backdrop-blur-sm">
        <p className="text-sm">
          💡 팁: 앱을 종료해도 작물은 계속 자랍니다!<br/>
          돈을 모아 <b>황금나무</b>를 심어보세요!
        </p>
      </div>
    </div>
  );
}
