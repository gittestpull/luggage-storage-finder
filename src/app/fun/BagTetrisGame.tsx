'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import AdSenseModal from '@/components/modals/AdSenseModal';

interface BagTetrisGameProps {
  onBack: () => void;
}

interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  typeId: number; // To track shape identity if needed
}

// Visual definition for drawing handles/details
interface ShapeDef {
  w: number;
  h: number;
  color: string;
  darkColor: string; // for border/handle
}

const BAG_SHAPES: ShapeDef[] = [
  { w: 2, h: 2, color: '#f59e0b', darkColor: '#b45309' }, // Square (Amber)
  { w: 1, h: 2, color: '#3b82f6', darkColor: '#1d4ed8' }, // Tall small (Blue)
  { w: 2, h: 1, color: '#10b981', darkColor: '#047857' }, // Wide small (Green)
  { w: 1, h: 3, color: '#ef4444', darkColor: '#b91c1c' }, // Long vertical (Red)
  { w: 3, h: 1, color: '#8b5cf6', darkColor: '#6d28d9' }, // Long horizontal (Purple)
  { w: 2, h: 3, color: '#ec4899', darkColor: '#be185d' }, // Large vertical (Pink)
  { w: 3, h: 2, color: '#14b8a6', darkColor: '#0f766e' }, // Large horizontal (Teal)
];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

export default function BagTetrisGame({ onBack }: BagTetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'paused'>('start');
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [showAd, setShowAd] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  // Game State Refs
  const boardRef = useRef<(string | null)[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const currentPieceRef = useRef<Piece | null>(null);
  const nextPieceRef = useRef<Piece | null>(null);
  const lastTimeRef = useRef(0);
  const dropCounterRef = useRef(0);
  const dropIntervalRef = useRef(1000); // ms
  const animationFrameRef = useRef<number>(0);
  const levelTimeRef = useRef(0); // Track time for level up
  const gameStartTimeRef = useRef(0);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('sky_packer_best');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
          move(-1, 0);
          break;
        case 'ArrowRight':
          move(1, 0);
          break;
        case 'ArrowDown':
          move(0, 1);
          setScore(s => s + 1); // Soft drop points
          break;
        case 'ArrowUp':
          rotate();
          break;
        case ' ': // Space hard drop (optional)
          // Implement hard drop if desired, for now just pause? No, space usually drops.
          // Let's implement hard drop
          while (!collide(boardRef.current, currentPieceRef.current!, 0, 1)) {
            currentPieceRef.current!.y++;
            setScore(s => s + 2);
          }
          // Lock immediately happens in next loop or force it here?
          // To be safe, just let the next tick lock it or force update
          dropCounterRef.current = dropIntervalRef.current + 100; // Force update
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

  // Main Game Loop Management
  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      gameStartTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState]);

  const initGame = () => {
    // Reset Board
    boardRef.current = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    setScore(0);
    setLines(0);
    setLevel(1);
    dropIntervalRef.current = 1000;
    levelTimeRef.current = 0;

    // Spawn first pieces
    spawnPiece();
    spawnPiece(); // Call twice so next becomes current, and we gen a new next.
    // Actually spawnPiece puts next into current.
    // So:
    nextPieceRef.current = generateRandomPiece();
    spawnPiece();
  };

  const generateRandomPiece = (): Piece => {
    // Increase variety based on level
    // Level 1: 0,1,2 (Simple)
    // Level 3: + 3,4 (Medium)
    // Level 5: + 5,6 (Complex)

    let maxIndex = 2;
    if (level >= 3) maxIndex = 4;
    if (level >= 5) maxIndex = 6;

    // Always full range just weighted? Or strict unlock? Strict unlock is better for "difficulty increase"
    // User asked: "30초 단위로 난이도 올려주고... 다양한 가방 모양이 나오며"
    // So we unlock more shapes.

    // Also speed increases.

    const idx = Math.floor(Math.random() * (Math.min(maxIndex, BAG_SHAPES.length - 1) + 1));
    const shape = BAG_SHAPES[idx];

    return {
      x: Math.floor((BOARD_WIDTH - shape.w) / 2),
      y: 0,
      w: shape.w,
      h: shape.h,
      color: shape.color,
      typeId: idx
    };
  };

  const spawnPiece = () => {
    currentPieceRef.current = nextPieceRef.current;
    nextPieceRef.current = generateRandomPiece();

    // Check collision on spawn
    if (collide(boardRef.current, currentPieceRef.current!)) {
      setGameState('gameover');
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem('sky_packer_best', score.toString());
      }
    }
  };

  const collide = (board: (string | null)[][], piece: Piece, offsetX = 0, offsetY = 0) => {
    const { x, y, w, h } = piece;
    const newX = x + offsetX;
    const newY = y + offsetY;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const boardY = newY + r;
        const boardX = newX + c;

        // Bounds check
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return true;
        }

        // Block check (ignore if y < 0, meant for top out buffer, but careful)
        if (boardY >= 0 && board[boardY][boardX] !== null) {
          return true;
        }
      }
    }
    return false;
  };

  const merge = (board: (string | null)[][], piece: Piece) => {
    const { x, y, w, h, color } = piece;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const boardY = y + r;
        const boardX = x + c;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          board[boardY][boardX] = color;
        }
      }
    }
  };

  const sweep = () => {
    let rowCount = 0;
    const board = boardRef.current;

    // Check from bottom up
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      let isFull = true;
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y][x] === null) {
          isFull = false;
          break;
        }
      }

      if (isFull) {
        // Remove line
        const row = board.splice(y, 1)[0];
        // Add new empty line at top
        board.unshift(Array(BOARD_WIDTH).fill(null));
        rowCount++;
        y++; // Check same index again since lines shifted down
      }
    }

    if (rowCount > 0) {
      // Scoring: 100, 300, 500, 800
      const points = [0, 100, 300, 500, 800]; // Classic Tetris
      // Bag bonus?
      setScore(prev => prev + (points[rowCount] || 800) * level);
      setLines(prev => prev + rowCount);
    }
  };

  const move = (dirX: number, dirY: number) => {
    if (!currentPieceRef.current) return;
    if (!collide(boardRef.current, currentPieceRef.current, dirX, dirY)) {
      currentPieceRef.current.x += dirX;
      currentPieceRef.current.y += dirY;
      draw();
    } else if (dirY > 0) {
      // Landed
      merge(boardRef.current, currentPieceRef.current);
      sweep();
      spawnPiece();
      draw();
    }
  };

  const rotate = () => {
    if (!currentPieceRef.current) return;
    const p = currentPieceRef.current;

    // Swap w and h
    const newW = p.h;
    const newH = p.w;

    // Backup
    const originalW = p.w;
    const originalH = p.h;
    const originalX = p.x;

    p.w = newW;
    p.h = newH;

    // Wall kick (basic)
    if (collide(boardRef.current, p)) {
      // Try shifting left
      p.x -= 1;
      if (collide(boardRef.current, p)) {
        // Try shifting right (if it was left wall)
        p.x += 2;
        if (collide(boardRef.current, p)) {
          // Revert
          p.x = originalX;
          p.w = originalW;
          p.h = originalH;
        }
      }
    }
    draw();
  };

  const update = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Difficulty Increase every 30s
    // We can use a simpler accumulation or verify real time
    // Let's use deltaTime accumulation for level logic
    if (gameState === 'playing') {
      levelTimeRef.current += deltaTime;
      if (levelTimeRef.current > 30000) { // 30 sec
        levelTimeRef.current = 0;
        setLevel(l => l + 1);
        dropIntervalRef.current = Math.max(100, dropIntervalRef.current * 0.9); // Speed up 10%
      }
    }

    dropCounterRef.current += deltaTime;
    if (dropCounterRef.current > dropIntervalRef.current) {
      move(0, 1);
      dropCounterRef.current = 0;
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

    const width = canvas.width;
    const height = canvas.height;

    // Dynamic cell size
    const cellSize = Math.floor(Math.min(width / BOARD_WIDTH, height / BOARD_HEIGHT));
    const boardPixelW = cellSize * BOARD_WIDTH;
    const boardPixelH = cellSize * BOARD_HEIGHT;
    const offsetX = (width - boardPixelW) / 2;
    const offsetY = (height - boardPixelH) / 2;

    // Clear
    ctx.fillStyle = '#1e293b'; // Dark slate
    ctx.fillRect(0, 0, width, height);

    // Draw "Cargo Hold" Background
    ctx.fillStyle = '#334155'; // Lighter slate
    ctx.fillRect(offsetX - 5, offsetY - 5, boardPixelW + 10, boardPixelH + 10);

    // Grid
    ctx.fillStyle = '#0f172a'; // Almost black
    ctx.fillRect(offsetX, offsetY, boardPixelW, boardPixelH);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for(let y=0; y<=BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y*cellSize);
      ctx.lineTo(offsetX + boardPixelW, offsetY + y*cellSize);
      ctx.stroke();
    }
    for(let x=0; x<=BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x*cellSize, offsetY);
      ctx.lineTo(offsetX + x*cellSize, offsetY + boardPixelH);
      ctx.stroke();
    }

    // Draw Locked Blocks
    boardRef.current.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          drawCell(ctx, offsetX + x * cellSize, offsetY + y * cellSize, cellSize, color);
        }
      });
    });

    // Draw Current Piece
    if (currentPieceRef.current) {
      const p = currentPieceRef.current;

      // Draw ghost (optional)
      // let ghostY = p.y;
      // while(!collide(boardRef.current, { ...p, y: ghostY + 1 })) { ghostY++; }
      // ctx.globalAlpha = 0.2;
      // drawPiece(ctx, offsetX, offsetY, cellSize, { ...p, y: ghostY });
      // ctx.globalAlpha = 1.0;

      drawPiece(ctx, offsetX, offsetY, cellSize, p);
    }
  };

  const drawPiece = (ctx: CanvasRenderingContext2D, offX: number, offY: number, size: number, p: Piece) => {
    // A piece is a rectangle.
    // However, in our grid logic, it occupies w*h cells.
    // Visually we want it to look like ONE BAG.

    const x = offX + p.x * size;
    const y = offY + p.y * size;
    const w = p.w * size;
    const h = p.h * size;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 4, h - 4, 8);
    ctx.fill();

    // Body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
    ctx.fill();

    // Border/Detail
    // Find shape def for dark color
    const def = BAG_SHAPES[p.typeId];
    ctx.strokeStyle = def ? def.darkColor : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Handle
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (p.w >= p.h) {
      // Horizontal handle on top
      ctx.moveTo(x + w * 0.4, y + 2);
      ctx.lineTo(x + w * 0.4, y - 4);
      ctx.lineTo(x + w * 0.6, y - 4);
      ctx.lineTo(x + w * 0.6, y + 2);
    } else {
      // Vertical handle on top? Or side? Suitcases usually handle on top (short edge)
      // If it's tall (1x2), handle is on top width (1).
      ctx.moveTo(x + w * 0.3, y + 2);
      ctx.lineTo(x + w * 0.3, y - 4);
      ctx.lineTo(x + w * 0.7, y - 4);
      ctx.lineTo(x + w * 0.7, y + 2);
    }
    ctx.stroke();

    // Zipper line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    if (p.w > p.h) {
      ctx.moveTo(x + 4, y + h/2);
      ctx.lineTo(x + w - 4, y + h/2);
    } else {
      ctx.moveTo(x + w/2, y + 4);
      ctx.lineTo(x + w/2, y + h - 4);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    // When drawing locked cells, they are individual blocks in the grid.
    // It's hard to reconstruct the original "bag" shape easily without storing metadata in the grid.
    // For now, we draw them as "cargo crates" or "parts of bags".
    // To make it look nice, we just draw a rounded rect with the color.

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, size - 2, size - 2, 4);
    ctx.fill();

    // Bevel effect
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x+1, y+1, size-2, size/2);
  };

  const startGame = () => {
    const countKey = 'sky_packer_count';
    const currentCount = parseInt(localStorage.getItem(countKey) || '0', 10) + 1;
    localStorage.setItem(countKey, currentCount.toString());

    if (currentCount % 10 === 0) {
      setShowAd(true);
      return;
    }
    startActualGame();
  };

  const startActualGame = () => {
    setShowAd(false);
    setGameState('playing');
    initGame();
  };

  const handleTouch = (action: string) => {
    if (gameState !== 'playing') return;
    switch(action) {
      case 'left': move(-1, 0); break;
      case 'right': move(1, 0); break;
      case 'rotate': rotate(); break;
      case 'down': move(0, 1); break; // Soft drop
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gray-900 flex flex-col items-center justify-center font-sans text-gray-100">
      <div className="w-full max-w-2xl text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-blue-400">Sky</span> Packer
        </h1>
        <p className="text-gray-400">비행기 화물칸에 짐을 적재하세요! (Level {level})</p>
      </div>

      {showAd && <AdSenseModal onClose={startActualGame} />}

      <div className="relative w-full max-w-[400px] aspect-[10/20] bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-700">
        <canvas
          ref={canvasRef}
          width={400}
          height={800}
          className="block w-full h-full"
        />

        {/* HUD */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-sm text-white border border-white/10">
            Score: <span className="text-yellow-400 font-bold">{score}</span>
           </div>
           <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-sm text-white border border-white/10">
            Level: <span className="text-green-400 font-bold">{level}</span>
           </div>
           {bestScore > 0 && (
             <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-gray-400 border border-white/5">
              Best: {bestScore}
             </div>
           )}
        </div>

        {/* Start / Game Over Overlay */}
        {(gameState === 'start' || gameState === 'gameover' || gameState === 'paused') && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
            {gameState === 'gameover' && (
              <div className="mb-6 text-center">
                <div className="text-5xl mb-2">💥</div>
                <h2 className="text-3xl font-bold text-red-500 mb-2">FULL CARGO!</h2>
                <p className="text-xl">Score: {score}</p>
                {score >= bestScore && score > 0 && (
                  <p className="text-yellow-400 animate-pulse font-bold mt-1">New Record!</p>
                )}
              </div>
            )}

            {gameState === 'paused' && (
              <h2 className="text-3xl font-bold text-yellow-500 mb-8">PAUSED</h2>
            )}

            {gameState === 'start' && (
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">✈️</div>
                <h2 className="text-2xl font-bold mb-2">준비되셨나요?</h2>
                <p className="text-gray-400 text-sm">빈틈없이 짐을 쌓아주세요.</p>
              </div>
            )}

            <Button
              onClick={() => gameState === 'paused' ? setGameState('playing') : startGame()}
              className="w-full max-w-xs py-6 text-xl font-bold bg-blue-600 hover:bg-blue-700 mb-4"
            >
              {gameState === 'paused' ? 'RESUME' : 'START MISSION'}
            </Button>

            <Button variant="outline" onClick={onBack} className="w-full max-w-xs border-gray-600 text-gray-300 hover:bg-gray-800">
              나가기
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-[400px] mt-6 h-32">
        <div className="col-start-1 row-start-2 bg-gray-800 rounded-lg flex items-center justify-center active:bg-gray-700"
             onTouchStart={(e) => { e.preventDefault(); handleTouch('left'); }}>
          ⬅️
        </div>
        <div className="col-start-3 row-start-2 bg-gray-800 rounded-lg flex items-center justify-center active:bg-gray-700"
             onTouchStart={(e) => { e.preventDefault(); handleTouch('right'); }}>
          ➡️
        </div>
        <div className="col-start-2 row-start-2 bg-gray-800 rounded-lg flex items-center justify-center active:bg-gray-700"
             onTouchStart={(e) => { e.preventDefault(); handleTouch('down'); }}>
          ⬇️
        </div>
        <div className="col-start-2 row-start-1 bg-blue-900/50 rounded-lg flex items-center justify-center active:bg-blue-800"
             onTouchStart={(e) => { e.preventDefault(); handleTouch('rotate'); }}>
          🔄
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        PC: 방향키 이동, 위쪽키 회전, 스페이스바(또는 아래) 드롭
      </p>
    </div>
  );
}
