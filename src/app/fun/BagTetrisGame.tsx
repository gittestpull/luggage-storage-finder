'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import AdSenseModal from '@/components/modals/AdSenseModal';

interface BagTetrisGameProps {
  onBack: () => void;
}

// 짐(Bag) 타입 정의
type BagType = 'suitcase' | 'backpack' | 'duffel' | 'box' | 'crate' | 'golf' | 'surfboard';

interface BagDef {
  type: BagType;
  w: number; // grid cells
  h: number; // grid cells
  color: string;
  detailColor: string;
  name: string;
  minLevel: number;
}

const BAG_TYPES: BagDef[] = [
  // Lv 1: Basic Squares & Rects
  { type: 'box', w: 2, h: 2, color: '#d97706', detailColor: '#92400e', name: '화물 박스', minLevel: 1 },
  { type: 'suitcase', w: 2, h: 3, color: '#3b82f6', detailColor: '#1d4ed8', name: '여행용 캐리어', minLevel: 1 },

  // Lv 2: Smaller fillers
  { type: 'backpack', w: 1, h: 2, color: '#ef4444', detailColor: '#b91c1c', name: '등산 배낭', minLevel: 2 },
  { type: 'duffel', w: 2, h: 1, color: '#10b981', detailColor: '#047857', name: '스포츠 가방', minLevel: 2 },

  // Lv 3: Large / Odd shapes (Still rectangular for V1 physics)
  { type: 'crate', w: 3, h: 2, color: '#8b5cf6', detailColor: '#6d28d9', name: '정밀 기기', minLevel: 3 },
  { type: 'golf', w: 1, h: 3, color: '#64748b', detailColor: '#334155', name: '골프 가방', minLevel: 3 },
  { type: 'surfboard', w: 1, h: 4, color: '#f59e0b', detailColor: '#b45309', name: '서핑 보드', minLevel: 4 },
];

interface GamePiece {
  id: number;
  def: BagDef;
  x: number; // grid x or pixel x depending on state
  y: number; // grid y or pixel y
  state: 'belt' | 'held' | 'falling' | 'placed';
}

const GRID_W = 10;
const GRID_H = 10; // 10x10 Grid = 100 Cells
const CELL_SIZE = 45; // Slightly larger

export default function BagTetrisGame({ onBack }: BagTetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'victory' | 'paused'>('start');
  const [level, setLevel] = useState(1);
  const [filledCount, setFilledCount] = useState(0);
  const [showAd, setShowAd] = useState(false);

  // Game System Refs
  const gridRef = useRef<(string | null)[][]>(
    Array(GRID_H).fill(null).map(() => Array(GRID_W).fill(null))
  );

  const craneRef = useRef({
    x: 4, // Grid column index
    y: 0,
    targetX: 4,
    holdingPiece: null as GamePiece | null,
    status: 'idle' as 'idle' | 'moving' | 'grabbing' | 'dropping',
    animTimer: 0
  });

  const beltRef = useRef({
    items: [] as GamePiece[],
    spawnTimer: 0,
    speed: 1,
  });

  const piecesRef = useRef<GamePiece[]>([]);
  const pieceIdCounter = useRef(0);

  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState !== 'playing') return;

      const crane = craneRef.current;

      switch (e.key) {
        case 'ArrowLeft':
          // Relaxed check: Allow moving unless in critical grab/drop phase
          if (crane.status !== 'grabbing' && crane.status !== 'dropping') {
            crane.targetX = Math.max(0, crane.targetX - 1);
            crane.status = 'moving';
          }
          break;
        case 'ArrowRight':
          const limit = GRID_W - (crane.holdingPiece ? crane.holdingPiece.def.w : 1);
          if (crane.status !== 'grabbing' && crane.status !== 'dropping') {
            crane.targetX = Math.min(limit, crane.targetX + 1);
            crane.status = 'moving';
          }
          break;
        case ' ': // Grab or Drop
        case 'ArrowDown':
          if (crane.status === 'moving' || crane.status === 'idle') {
            if (crane.holdingPiece) {
              dropPiece();
            } else {
              grabFromBelt();
            }
          }
          break;
        case 'Escape':
        case 'p':
          setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const initGame = (startLevel = 1) => {
    gridRef.current = Array(GRID_H).fill(null).map(() => Array(GRID_W).fill(null));
    piecesRef.current = [];
    beltRef.current.items = [];
    craneRef.current = { x: 4, y: 0, targetX: 4, holdingPiece: null, status: 'idle', animTimer: 0 };
    setFilledCount(0);
    setLevel(startLevel);

    // Seed belt
    for (let i = 0; i < 4; i++) spawnBeltItem(startLevel);
  };

  const spawnBeltItem = (lvl: number) => {
    // Filter available bags by level
    const available = BAG_TYPES.filter(b => b.minLevel <= lvl);
    const def = available[Math.floor(Math.random() * available.length)];

    const piece: GamePiece = {
      id: pieceIdCounter.current++,
      def,
      x: 600 + (beltRef.current.items.length * 140),
      y: 700,
      state: 'belt',
    };

    piecesRef.current.push(piece);
    beltRef.current.items.push(piece);
  };

  const grabFromBelt = () => {
    if (beltRef.current.items.length === 0) return;
    const item = beltRef.current.items[0];

    // Pickup Zone Check (relaxed)
    if (item.x <= 380 && item.x >= 280) {
      beltRef.current.items.shift();
      item.state = 'held';
      craneRef.current.holdingPiece = item;
      craneRef.current.status = 'grabbing';

      // Simulate grab delay logic
      setTimeout(() => {
        if (craneRef.current.status === 'grabbing') craneRef.current.status = 'idle';
      }, 200);
    }
  };

  const dropPiece = () => {
    const crane = craneRef.current;
    if (!crane.holdingPiece) return;

    const p = crane.holdingPiece;
    crane.status = 'dropping'; // Block input momentarily

    // Find drop target Y
    let highestObstacleY = GRID_H;

    for (let cx = 0; cx < p.def.w; cx++) {
      const col = Math.floor(crane.x) + cx;
      if (col >= GRID_W) continue;
      for (let r = 0; r < GRID_H; r++) {
        if (gridRef.current[r][col]) {
          if (r < highestObstacleY) highestObstacleY = r;
          break;
        }
      }
    }

    const targetGridY = highestObstacleY - p.def.h;

    if (targetGridY < 0) {
      setGameState('gameover');
      return;
    }

    // Update State
    p.state = 'placed';
    p.x = Math.floor(crane.x);
    p.y = targetGridY;

    // Lock into grid
    let newFilled = 0;
    for (let r = 0; r < p.def.h; r++) {
      for (let c = 0; c < p.def.w; c++) {
        if (gridRef.current[targetGridY + r]) {
          gridRef.current[targetGridY + r][p.x + c] = p.def.color;
        }
      }
    }

    // Recalculate filled count
    let totalFilled = 0;
    for (let r = 0; r < GRID_H; r++) {
      for (let c = 0; c < GRID_W; c++) {
        if (gridRef.current[r][c]) totalFilled++;
      }
    }
    setFilledCount(totalFilled);

    crane.holdingPiece = null;
    spawnBeltItem(level);

    // Reset status after "anim"
    setTimeout(() => {
      crane.status = 'idle';
      checkWin(totalFilled);
    }, 300);
  };

  const checkWin = (filled: number) => {
    // Win Condition: Less than 10 empty spots (Total 100)
    const totalCells = GRID_W * GRID_H;
    const empty = totalCells - filled;

    if (empty <= 10) {
      setGameState('victory');
    }
  };

  const update = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (gameState === 'playing') {
      // Crane Move
      const crane = craneRef.current;
      const diff = crane.targetX - crane.x;
      if (Math.abs(diff) > 0.05) {
        crane.x += diff * 0.25; // Faster crane
      } else {
        crane.x = crane.targetX;
      }
      if (crane.holdingPiece) crane.holdingPiece.x = crane.x;

      // Belt Move
      beltRef.current.spawnTimer += deltaTime;
      const pickupX = 330;

      beltRef.current.items.forEach((item, idx) => {
        const targetX = pickupX + (idx * 160);
        const dx = targetX - item.x;
        if (Math.abs(dx) > 1) item.x += dx * 0.08;
        else item.x = targetX;
      });
    }

    draw();

    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(update);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Grid
    const gridPixelW = GRID_W * CELL_SIZE;
    const gridPixelH = GRID_H * CELL_SIZE;
    const gridOffsetX = (w - gridPixelW) / 2;
    const gridOffsetY = 100;

    // Draw Grid BG
    ctx.fillStyle = '#334155';
    ctx.fillRect(gridOffsetX, gridOffsetY, gridPixelW, gridPixelH);

    // Warning Line (Top)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(gridOffsetX, gridOffsetY, gridPixelW, CELL_SIZE * 2);

    // Draw Placed Pieces (Iterate grid for single block rendering or pieces for sprite rendering)
    // Using pieces list is better for visuals
    piecesRef.current.forEach(p => {
      if (p.state === 'placed') {
        drawBag(ctx, gridOffsetX + p.x * CELL_SIZE, gridOffsetY + p.y * CELL_SIZE, CELL_SIZE, p);
      }
    });

    // Grid Overlay Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_W; i++) {
      ctx.beginPath(); ctx.moveTo(gridOffsetX + i * CELL_SIZE, gridOffsetY); ctx.lineTo(gridOffsetX + i * CELL_SIZE, gridOffsetY + gridPixelH); ctx.stroke();
    }
    for (let i = 0; i <= GRID_H; i++) {
      ctx.beginPath(); ctx.moveTo(gridOffsetX, gridOffsetY + i * CELL_SIZE); ctx.lineTo(gridOffsetX + gridPixelW, gridOffsetY + i * CELL_SIZE); ctx.stroke();
    }

    // Crane
    const crane = craneRef.current;
    const cx = gridOffsetX + crane.x * CELL_SIZE;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, gridOffsetY - 5); ctx.stroke();

    // Crane Head
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 20, gridOffsetY - 30, 40, 20);

    // Held Piece
    if (crane.holdingPiece) {
      drawBag(ctx, cx, gridOffsetY - 5, CELL_SIZE, crane.holdingPiece);
    }

    // Belt Area
    const beltY = h - 140;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, beltY, w, 140);

    // Animated Tracks
    const time = Date.now();
    for (let i = 0; i < w; i += 30) {
      ctx.fillStyle = (i + Math.floor(time / 10)) % 60 < 30 ? '#334155' : '#1e293b';
      ctx.fillRect(i, beltY + 10, 30, 120);
    }

    // Pickup Zone Highlight
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(330, beltY + 5, 100, 130);
    ctx.fillStyle = '#22c55e';
    ctx.font = '12px Arial';
    ctx.fillText('PICKUP', 355, beltY + 130);

    // Belt Items
    const beltItemY = beltY + 60;
    beltRef.current.items.forEach(p => {
      drawBag(ctx, p.x, beltItemY, CELL_SIZE, p);
    });
  };

  const drawBag = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, p: GamePiece) => {
    const w = p.def.w * size;
    const h = p.def.h * size;
    const pad = 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 4, y + 4, w, h);

    ctx.fillStyle = p.def.color;

    switch (p.def.type) {
      case 'box':
        ctx.fillRect(x + pad, y + pad, w - pad * 2, h - pad * 2);
        ctx.fillStyle = '#fcd34d'; // Tape
        ctx.fillRect(x + w / 2 - 3, y + pad, 6, h - pad * 2);
        break;
      case 'suitcase':
        roundRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + w / 4, y + pad, 2, h - pad * 2);
        ctx.fillRect(x + w * 0.75, y + pad, 2, h - pad * 2);
        break;
      default:
        roundRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, 4);
    }
    // Name overlay (Debug/Visual)
    // ctx.fillStyle = 'white'; ctx.font = '10px Arial'; ctx.fillText(p.def.name, x, y+10);
  };

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
  }

  const startGame = () => {
    setGameState('playing');
    initGame(level);
  };

  const nextLevel = () => {
    setGameState('playing');
    initGame(level + 1);
  };

  // Main Loop Trigger
  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState]);

  const totalCells = GRID_W * GRID_H;
  const progress = Math.min(100, (filledCount / (totalCells - 10)) * 100);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gray-900 flex flex-col items-center justify-center font-sans text-gray-100">
      <div className="w-full max-w-2xl flex justify-between items-center mb-4 px-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Sky Packer <span className="text-white text-sm">Lv.{level}</span></h1>
          <p className="text-xs text-gray-400">빈 공간을 10칸 이하로 줄이세요!</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">화물 적재율</div>
          <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-sm font-bold">{filledCount} / {totalCells - 10}</div>
        </div>
      </div>

      {showAd && <AdSenseModal onClose={() => { setShowAd(false); startGame(); }} />}

      <div className="relative w-full max-w-[600px] aspect-[4/5] bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-700">
        <canvas
          ref={canvasRef}
          width={600}
          height={750}
          className="block w-full h-full"
        />

        {/* Overlays */}
        {(gameState === 'start' || gameState === 'gameover' || gameState === 'victory' || gameState === 'paused') && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10 text-center">

            {gameState === 'victory' && (
              <div className="mb-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-4xl font-bold text-yellow-400 mb-2">적재 완료!</h2>
                <p className="text-white mb-6">화물칸을 완벽하게 채웠습니다.</p>
                <Button onClick={nextLevel} className="w-48 py-6 text-xl bg-green-600 hover:bg-green-700">다음 레벨</Button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div className="mb-8">
                <div className="text-6xl mb-4">💥</div>
                <h2 className="text-3xl font-bold text-red-500 mb-2">적재 실패!</h2>
                <p className="text-gray-300">더 이상 쌓을 공간이 없습니다.</p>
                <Button onClick={() => initGame(level)} className="mt-4 w-48 bg-gray-600">재도전</Button>
              </div>
            )}

            {gameState === 'start' && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Mission Start</h2>
                <p className="text-gray-400 mb-8">컨베이어 벨트의 화물을<br />크레인으로 옮겨 빈틈없이 채우세요.</p>
                <Button onClick={startGame} className="w-48 py-4 text-xl bg-blue-600">게임 시작</Button>
              </div>
            )}

            <Button variant="ghost" onClick={onBack} className="mt-4 text-gray-400 hover:text-white">나가기</Button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-6 flex gap-2 w-full max-w-[600px] h-20">
        <button className="flex-1 bg-gray-700 rounded-lg active:bg-gray-600 text-2xl"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'ArrowLeft' }))}>⬅️</button>
        <button className="flex-[2] bg-blue-600 rounded-lg active:bg-blue-500 text-xl font-bold text-white"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { 'key': ' ' }))}>GRAB / DROP</button>
        <button className="flex-1 bg-gray-700 rounded-lg active:bg-gray-600 text-2xl"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'ArrowRight' }))}>➡️</button>
      </div>
    </div>
  );
}
