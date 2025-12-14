'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

interface JumpGameProps {
  onBack: () => void;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'normal' | 'moving' | 'vanishing';
  vx?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function JumpGame({ onBack }: JumpGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0); // Time in seconds
  const [bestScore, setBestScore] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [myNickname, setMyNickname] = useState(''); // Current user's nickname for the record
  const [globalBest, setGlobalBest] = useState<{ score: number, time: number, userName: string } | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Game configuration
  const GRAVITY = 0.4;
  const JUMP_FORCE = -12;
  const PLAYER_SPEED = 5;

  // Game state refs (to avoid re-renders)
  const playerRef = useRef({
    x: 0,
    y: 0,
    w: 40,
    h: 40,
    vx: 0,
    vy: 0,
    facingRight: true
  });

  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraYRef = useRef(0);
  const scoreRef = useRef(0);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Load best score from API
    fetch('/api/game/score?gameId=jump')
      .then(res => res.json())
      .then(data => {
        // Use API auth flag
        setIsAnonymous(!data.authenticated);

        if (data.personal) {
          setBestScore(data.personal.score);
          setBestTime(data.personal.time);
          if (data.personal.nickname) setMyNickname(data.personal.nickname);
        }
        if (data.global) {
          setGlobalBest(data.global);
        }
      })
      .catch(err => console.error('Failed to load score', err));

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' && gameState === 'gameover') startGame();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoop();
    }
  }, [gameState]);

  const initGame = (canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;

    // Reset player
    playerRef.current = {
      x: width / 2 - 20,
      y: height - 150,
      w: 40,
      h: 40,
      vx: 0,
      vy: 0,
      facingRight: true
    };

    // Initial platforms
    platformsRef.current = [
      { x: width / 2 - 50, y: height - 50, w: 100, h: 20, type: 'normal' }
    ];

    // Generate starter platforms
    let currentY = height - 50;
    while (currentY > 0) {
      currentY -= 100 + Math.random() * 40;
      platformsRef.current.push(generatePlatform(width, currentY));
    }

    cameraYRef.current = 0;
    scoreRef.current = 0;
    startTimeRef.current = Date.now();
    setScore(0);
    setTime(0);
    particlesRef.current = [];
  };

  const generatePlatform = (width: number, y: number): Platform => {
    const w = 80 + Math.random() * 40;
    const x = Math.random() * (width - w);
    const typeRoll = Math.random();
    let type: 'normal' | 'moving' | 'vanishing' = 'normal';
    let vx = 0;

    if (scoreRef.current > 1000 && typeRoll > 0.8) {
      type = 'moving';
      vx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random());
    } else if (scoreRef.current > 2000 && typeRoll > 0.9) {
      type = 'vanishing';
    }

    return { x, y, w, h: 20, type, vx };
  };

  const saveScore = async (finalScore: number, finalTime: number, customNickname?: string) => {
    try {
      // Optimistic updateto UI (Personal)
      if (finalScore > bestScore || (finalScore === bestScore && finalTime < bestTime)) {
        setBestScore(finalScore);
        setBestTime(finalTime);
      }

      await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'jump',
          score: finalScore,
          time: finalTime,
          nickname: customNickname || myNickname // Use provided or state
        })
      });

      // Reload to ensure server sync and get updated global
      fetch('/api/game/score?gameId=jump')
        .then(res => res.json())
        .then(data => {
          if (data.personal) {
            setBestScore(data.personal.score);
            setBestTime(data.personal.time);
          }
          if (data.global) {
            setGlobalBest(data.global);
          }
        });

    } catch (err) {
      console.error('Failed to save score', err);
    }
  };

  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0,
        color
      });
    }
  };

  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = Math.min(container.clientWidth, 600);
      canvas.height = Math.min(window.innerHeight * 0.7, 800);
    }

    initGame(canvas);
    setGameState('playing');
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const player = playerRef.current;
    const platforms = platformsRef.current;

    // Timer Update
    const currentTime = (Date.now() - startTimeRef.current) / 1000;
    setTime(currentTime);

    // --- Update ---

    // Horizontal movement
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      player.vx = -PLAYER_SPEED;
      player.facingRight = false;
    } else if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      player.vx = PLAYER_SPEED;
      player.facingRight = true;
    } else {
      player.vx *= 0.8; // Friction
    }

    player.x += player.vx;

    // Screen wrapping
    if (player.x + player.w < 0) player.x = width;
    if (player.x > width) player.x = -player.w;

    // Vertical movement
    player.vy += GRAVITY;
    player.y += player.vy;

    // Jump detection
    if (player.vy > 0) { // Only check collision when falling
      for (const p of platforms) {
        if (
          player.y + player.h > p.y &&
          player.y + player.h < p.y + p.h + player.vy + 5 && // Tolerance
          player.x + player.w * 0.5 > p.x &&
          player.x + player.w * 0.5 < p.x + p.w
        ) {
          player.vy = JUMP_FORCE;
          createParticles(player.x + player.w / 2, player.y + player.h, 5, '#fbbf24'); // Yellow dust

          if (p.type === 'vanishing') {
            p.y = 99999; // Remove platform
          }
          break;
        }
      }
    }

    // Camera movement (only move up)
    const targetY = height * 0.4;
    if (player.y < targetY) {
      const diff = targetY - player.y;
      player.y = targetY;

      // Move platforms down
      platforms.forEach(p => {
        p.y += diff;
      });

      // Score
      scoreRef.current += Math.floor(diff);
      setScore(scoreRef.current);

      // Remove platforms below screen
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].y > height) {
          platforms.splice(i, 1);
          // Add new platform at top
          const highestY = Math.min(...platforms.map(p => p.y));
          // Distance between platforms increases slightly with score
          const gap = 100 + Math.min(scoreRef.current / 100, 100);
          if (highestY > 100) { // Keep generating
            platforms.push(generatePlatform(width, highestY - gap));
          }
        }
      }
    }

    // Update platforms
    platforms.forEach(p => {
      if (p.type === 'moving' && p.vx) {
        p.x += p.vx;
        if (p.x < 0 || p.x + p.w > width) p.vx *= -1;
      }
    });

    // Game Over check
    if (player.y > height) {
      setGameState('gameover');
      const finalScore = Math.floor(scoreRef.current);
      const finalTime = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(2));

      saveScore(finalScore, finalTime);
      return; // Stop loop
    }

    // --- Draw ---
    ctx.clearRect(0, 0, width, height);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e0f2fe'); // Sky blue light
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Grid (optional style)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offsetY = (scoreRef.current) % gridSize;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Draw Platforms
    platforms.forEach(p => {
      ctx.fillStyle = p.type === 'moving' ? '#60a5fa' : (p.type === 'vanishing' ? '#f87171' : '#10b981'); // Blue, Red, Green

      // Rounded rect for platform
      const r = 5;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, r);
      ctx.fill();

      // Top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h / 2, r);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Player (Suitcase)
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    // Squish effect on jump/land could go here
    if (!player.facingRight) ctx.scale(-1, 1);

    // Body
    ctx.fillStyle = '#f59e0b'; // Amber-500
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 30, 4);
    ctx.fill();
    ctx.strokeStyle = '#b45309'; // Amber-700
    ctx.lineWidth = 2;
    ctx.stroke();

    // Handle
    ctx.beginPath();
    ctx.moveTo(-6, -15);
    ctx.lineTo(-6, -20);
    ctx.lineTo(6, -20);
    ctx.lineTo(6, -15);
    ctx.stroke();

    // Eyes (Cute face)
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-5, -5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(-4 + (player.vx * 0.2), -5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6 + (player.vx * 0.2), -5, 1.5, 0, Math.PI * 2); ctx.fill();

    // Stickers (decoration)
    ctx.fillStyle = '#ef4444'; // Red sticker
    ctx.beginPath(); ctx.arc(8, 5, 3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Draw Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      } else {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  // Touch controls
  const handleTouchStart = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      keysRef.current['ArrowLeft'] = true;
      keysRef.current['ArrowRight'] = false;
    } else {
      keysRef.current['ArrowRight'] = true;
      keysRef.current['ArrowLeft'] = false;
    }
  };

  const handleTouchEnd = () => {
    keysRef.current['ArrowLeft'] = false;
    keysRef.current['ArrowRight'] = false;
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <span className="text-yellow-500">짐</span>프 (JUMP) 게임!
        </h1>
        <p className="text-gray-600">짐가방을 잃어버리지 않게 최대한 높이 올라가세요!</p>
      </div>

      <div className="relative w-full max-w-[500px] aspect-[3/4] bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-gray-200">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />

        {/* Score Overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full font-bold text-gray-800 shadow-sm border border-gray-100">
            🏆 {Math.floor(score)}
          </div>
          <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full font-bold text-blue-600 shadow-sm border border-gray-100">
            ⏱️ {time.toFixed(1)}s
          </div>
        </div>

        {/* High Score Overlay */}
        {bestScore > 0 && (
          <div className="absolute top-4 right-4 bg-yellow-100/80 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-yellow-800 border border-yellow-200">
            최고: {bestScore} ({bestTime}s)
          </div>
        )}

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 p-6 overscroll-contain overflow-y-auto">
            <div className="text-6xl mb-4 animate-bounce">🧳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">준비되셨나요?</h2>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
              {/* My Best */}
              {bestScore > 0 ? (
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 shadow-sm text-center">
                  <div className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold mb-1">My Best</div>
                  <div className="text-2xl font-black text-yellow-500 mb-1">{bestScore}</div>
                  <div className="text-xs text-yellow-700 bg-white/50 rounded-full px-2 py-0.5 inline-block">
                    {bestTime}s
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center flex flex-col justify-center items-center text-gray-400 text-xs">
                  <div>기록 없음</div>
                  <div>도전해보세요!</div>
                </div>
              )}

              {/* Global Best */}
              {globalBest ? (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-bold">1st</div>
                  <div className="text-[10px] uppercase tracking-widest text-purple-600 font-bold mb-1 truncate px-1">{globalBest.userName}</div>
                  <div className="text-2xl font-black text-purple-500 mb-1">{globalBest.score}</div>
                  <div className="text-xs text-purple-700 bg-white/50 rounded-full px-2 py-0.5 inline-block">
                    {globalBest.time}s
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center flex flex-col justify-center items-center text-gray-400 text-xs">
                  <div>전체 기록 없음</div>
                  <div>1등을 노려보세요!</div>
                </div>
              )}
            </div>

            <p className="text-gray-500 mb-6 text-center text-sm">
              화살표 키나 화면 하단 버튼을 눌러<br />최대한 높이 올라가세요!
            </p>
            <Button size="lg" onClick={startGame} className="text-xl font-bold px-8 py-6 rounded-2xl shadow-xl shadow-blue-500/30 w-full max-w-xs bg-blue-600 hover:bg-blue-700 mb-3 min-h-[72px] relative overflow-hidden transition-all active:scale-95">
              <span className="relative z-10">게임 시작! 🚀</span>
            </Button>
            <Button
              variant="outline"
              className="w-full max-w-xs py-4 text-base min-h-[56px]"
              onClick={onBack}
            >
              메뉴로 나가기
            </Button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 text-white p-6">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-3xl font-bold mb-6">게임 오버!</h2>

            {/* New Record Celebration */}
            {(score > bestScore || (score === bestScore && score > 0 && time < bestTime)) && (
              <div className="mb-6 animate-pulse">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-black text-lg shadow-lg border-2 border-white transform rotate-2 inline-block">🎉 New Record! 🎉</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
              <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-md border border-white/10 col-span-2">
                <div className="text-gray-400 text-xs mb-1">이번 점수</div>
                <div className="text-4xl font-bold text-white mb-1">{Math.floor(score)}</div>
                <div className="text-sm text-blue-300 font-mono">{time.toFixed(2)}초</div>
              </div>

              <div className="bg-yellow-500/10 p-3 rounded-xl text-center backdrop-blur-md border border-yellow-500/30">
                <div className="text-yellow-200/70 text-[10px] mb-1 uppercase">My Best</div>
                <div className="text-xl font-bold text-yellow-400">{bestScore > 0 ? bestScore : '-'}</div>
                <div className="text-[10px] text-yellow-200/70">{bestScore > 0 ? `${bestTime}s` : '-'}</div>
              </div>

              <div className="bg-purple-500/10 p-3 rounded-xl text-center backdrop-blur-md border border-purple-500/30">
                <div className="text-purple-200/70 text-[10px] mb-1 uppercase">World Best</div>
                <div className="text-xl font-bold text-purple-400">{globalBest ? globalBest.score : '-'}</div>
                <div className="text-[10px] text-purple-200/70">{globalBest ? `${globalBest.time}s` : '-'}</div>
              </div>
            </div>

            {/* Nickname & Save Section */}
            {isAnonymous ? (
              <div className="bg-white/5 p-3 rounded-lg mb-4 w-full text-center">
                <p className="text-gray-400 text-xs mb-1">비회원 기록 저장됨 (자동)</p>
                <p className="text-sm font-bold text-gray-200">랜덤 닉네임이 부여되었습니다.</p>
              </div>
            ) : (
              <div className="bg-white/10 p-3 rounded-xl mb-6 w-full max-w-xs backdrop-blur-md">
                <label className="text-xs text-gray-300 block mb-1">기록에 남길 별명</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={myNickname}
                    onChange={(e) => setMyNickname(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 font-bold"
                    placeholder="별명 입력"
                  />
                  <button
                    onClick={() => saveScore(score, time, myNickname)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg font-bold transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>
            )}

            <Button size="lg" onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-black border-none text-xl font-black px-8 py-6 rounded-2xl shadow-xl shadow-yellow-500/30 w-full max-w-xs mb-3 min-h-[72px] transition-all active:scale-95">
              다시 도전하기 🔄
            </Button>
            <Button
              variant="outline"
              className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white w-full max-w-xs"
              onClick={onBack}
            >
              메뉴로 나가기
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="w-full max-w-[500px] mt-6 grid grid-cols-2 gap-4 h-24">
        <button
          className="bg-white rounded-2xl shadow-md border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 active:bg-gray-50 flex items-center justify-center text-4xl select-none touch-manipulation"
          onMouseDown={() => handleTouchStart('left')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('left'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(); }}
        >
          ⬅️
        </button>
        <button
          className="bg-white rounded-2xl shadow-md border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 active:bg-gray-50 flex items-center justify-center text-4xl select-none touch-manipulation"
          onMouseDown={() => handleTouchStart('right')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('right'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(); }}
        >
          ➡️
        </button>
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm">
        PC: 방향키 사용 | Mobile: 하단 버튼 터치
      </div>
    </div>
  );
}
