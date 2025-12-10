'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

interface ShootingGameProps {
  onBack: () => void;
}

interface GameObject {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp?: number;
  type?: string;
  emoji?: string;
}

export default function ShootingGame({ onBack }: ShootingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'victory'>('start');
  const [score, setScore] = useState(0);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [bossActive, setBossActive] = useState(false);

  // Game configuration
  const PLAYER_SPEED = 300; // px per second
  const BULLET_SPEED = 600; // px per second
  const ENEMY_SPEED = 180; // px per second
  const BOSS_HP = 500;

  // Game state refs
  const playerRef = useRef<GameObject>({ x: 0, y: 0, w: 40, h: 40, vx: 0, vy: 0, emoji: '✈️' });
  const bulletsRef = useRef<GameObject[]>([]);
  const enemiesRef = useRef<GameObject[]>([]);
  const itemsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<any[]>([]);
  const bossRef = useRef<GameObject | null>(null);

  const scoreRef = useRef(0);
  const timeRef = useRef(0); // Game time in seconds
  const frameRef = useRef(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const shotTimerRef = useRef(0);
  const spawnTimerRef = useRef(0);

  useEffect(() => {
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

  const initGame = (canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;

    playerRef.current = {
      x: width / 2 - 20,
      y: height - 80,
      w: 40,
      h: 40,
      vx: 0,
      vy: 0,
      emoji: '✈️'
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    bossRef.current = null;
    scoreRef.current = 0;
    timeRef.current = 0;
    frameRef.current = 0;
    lastTimeRef.current = Date.now();
    shotTimerRef.current = 0;
    spawnTimerRef.current = 0;

    setScore(0);
    setWeaponLevel(1);
    setBossActive(false);
  };

  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 200, // px/s
        vy: (Math.random() - 0.5) * 200,
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
    gameLoop();
  };

  const spawnEnemy = (width: number) => {
    const w = 40;
    const x = Math.random() * (width - w);
    enemiesRef.current.push({
      x,
      y: -50,
      w,
      h: 40,
      vx: 0,
      vy: ENEMY_SPEED + (timeRef.current * 2), // Get faster over time
      hp: 1 + Math.floor(timeRef.current / 30),
      emoji: '🧳'
    });
  };

  const spawnBoss = (width: number) => {
    bossRef.current = {
      x: width / 2 - 60,
      y: -150,
      w: 120,
      h: 120,
      vx: 120, // px/s
      vy: 60, // px/s
      hp: BOSS_HP,
      emoji: '👹'
    };
    setBossActive(true);
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const player = playerRef.current;

    const now = Date.now();
    let dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    // Cap dt to avoid huge jumps
    if (dt > 0.1) dt = 0.1;

    if (gameState !== 'playing') return;

    timeRef.current += dt;

    // Spawn boss after 60 seconds
    if (timeRef.current >= 60 && !bossRef.current && !bossActive) {
        spawnBoss(width);
    }

    // --- Update ---

    // Player Movement
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) player.x -= PLAYER_SPEED * dt;
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) player.x += PLAYER_SPEED * dt;
    if (keysRef.current['ArrowUp'] || keysRef.current['w']) player.y -= PLAYER_SPEED * dt;
    if (keysRef.current['ArrowDown'] || keysRef.current['s']) player.y += PLAYER_SPEED * dt;

    // Clamp player to screen
    player.x = Math.max(0, Math.min(width - player.w, player.x));
    player.y = Math.max(0, Math.min(height - player.h, player.y));

    // Auto Shoot
    shotTimerRef.current += dt;
    if (shotTimerRef.current > 0.15) { // Shoot every 0.15s
        shotTimerRef.current = 0;
        const level = Math.min(weaponLevel, 3); // Max level 3
        if (level === 1) {
            bulletsRef.current.push({ x: player.x + player.w/2 - 5, y: player.y, w: 10, h: 20, vx: 0, vy: -BULLET_SPEED });
        } else if (level === 2) {
            bulletsRef.current.push({ x: player.x + player.w/2 - 15, y: player.y, w: 10, h: 20, vx: 0, vy: -BULLET_SPEED });
            bulletsRef.current.push({ x: player.x + player.w/2 + 5, y: player.y, w: 10, h: 20, vx: 0, vy: -BULLET_SPEED });
        } else {
            bulletsRef.current.push({ x: player.x + player.w/2 - 20, y: player.y, w: 10, h: 20, vx: -120, vy: -BULLET_SPEED });
            bulletsRef.current.push({ x: player.x + player.w/2 - 5, y: player.y, w: 10, h: 20, vx: 0, vy: -BULLET_SPEED });
            bulletsRef.current.push({ x: player.x + player.w/2 + 10, y: player.y, w: 10, h: 20, vx: 120, vy: -BULLET_SPEED });
        }
    }

    // Spawn Enemies
    if (!bossRef.current) {
        spawnTimerRef.current += dt;
        const spawnInterval = Math.max(0.3, 1.0 - (timeRef.current / 100)); // Spawn faster over time
        if (spawnTimerRef.current > spawnInterval) {
            spawnTimerRef.current = 0;
            spawnEnemy(width);
        }
    }

    // Update Bullets
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -50 || b.x < 0 || b.x > width) bulletsRef.current.splice(i, 1);
    }

    // Update Enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        e.y += e.vy * dt;

        // Collision with Player
        if (
            player.x < e.x + e.w &&
            player.x + player.w > e.x &&
            player.y < e.y + e.h &&
            player.y + player.h > e.y
        ) {
            setGameState('gameover');
            return;
        }

        // Cleanup
        if (e.y > height) enemiesRef.current.splice(i, 1);
    }

    // Update Boss
    if (bossRef.current) {
        const boss = bossRef.current;
        if (boss.y < 50) boss.y += 60 * dt; // Move into position
        boss.x += boss.vx * dt;
        if (boss.x < 0 || boss.x + boss.w > width) boss.vx *= -1;

        // Collision with Player
        if (
            player.x < boss.x + boss.w &&
            player.x + player.w > boss.x &&
            player.y < boss.y + boss.h &&
            player.y + player.h > boss.y
        ) {
             setGameState('gameover');
             return;
        }
    }

    // Bullet Collisions
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        let hit = false;

        // Hit Enemy
        for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
            const e = enemiesRef.current[j];
            if (
                b.x < e.x + e.w &&
                b.x + b.w > e.x &&
                b.y < e.y + e.h &&
                b.y + b.h > e.y
            ) {
                e.hp = (e.hp || 1) - 1;
                hit = true;
                createParticles(e.x + e.w/2, e.y + e.h/2, 3, '#fbbf24');
                if ((e.hp || 0) <= 0) {
                    enemiesRef.current.splice(j, 1);
                    scoreRef.current += 100;
                    setScore(scoreRef.current);

                    // Drop Item Chance (20%)
                    if (Math.random() < 0.2) {
                        itemsRef.current.push({
                            x: e.x, y: e.y, w: 30, h: 30, vx: 0, vy: 120, type: 'upgrade', emoji: '⭐'
                        });
                    }
                }
                break;
            }
        }

        // Hit Boss
        if (!hit && bossRef.current) {
            const boss = bossRef.current;
            if (
                b.x < boss.x + boss.w &&
                b.x + b.w > boss.x &&
                b.y < boss.y + boss.h &&
                b.y + b.h > boss.y
            ) {
                boss.hp = (boss.hp || 1) - 1;
                hit = true;
                createParticles(b.x, b.y, 2, '#ef4444');

                if ((boss.hp || 0) <= 0) {
                    // Boss Dead
                    bossRef.current = null;
                    scoreRef.current += 5000;
                    setScore(scoreRef.current);
                    setGameState('victory');
                }
            }
        }

        if (hit) bulletsRef.current.splice(i, 1);
    }

    // Update Items
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        item.y += item.vy * dt;

        // Collect Item
        if (
            player.x < item.x + item.w &&
            player.x + player.w > item.x &&
            player.y < item.y + item.h &&
            player.y + player.h > item.y
        ) {
            itemsRef.current.splice(i, 1);
            setWeaponLevel(prev => Math.min(prev + 1, 3));
            scoreRef.current += 500;
            setScore(scoreRef.current);
            createParticles(player.x + player.w/2, player.y, 10, '#ffff00');
        } else if (item.y > height) {
            itemsRef.current.splice(i, 1);
        }
    }

    // --- Draw ---
    ctx.clearRect(0, 0, width, height);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e1b4b'); // Dark blue space
    gradient.addColorStop(1, '#312e81');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = 'white';
    for(let k=0; k<20; k++) {
        const sx = (Math.sin(k * 132 + timeRef.current * 0.2) * width + width) % width;
        const sy = (Math.cos(k * 45 + timeRef.current * 0.5) * height + height) % height;
        ctx.fillRect(sx, sy, 2, 2);
    }

    // Draw Player
    ctx.font = '40px Arial';
    ctx.fillText(player.emoji || '✈️', player.x, player.y + 35);

    // Draw Enemies
    enemiesRef.current.forEach(e => {
        ctx.font = '40px Arial';
        ctx.fillText(e.emoji || '🧳', e.x, e.y + 35);
    });

    // Draw Boss
    if (bossRef.current) {
        const boss = bossRef.current;
        ctx.font = '100px Arial';
        ctx.fillText(boss.emoji || '👹', boss.x, boss.y + 100);

        // HP Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(boss.x, boss.y - 20, boss.w, 10);
        ctx.fillStyle = 'green';
        ctx.fillRect(boss.x, boss.y - 20, boss.w * ((boss.hp || 1) / BOSS_HP), 10);
    }

    // Draw Bullets
    ctx.fillStyle = '#fbbf24'; // Yellow
    bulletsRef.current.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x + b.w/2, b.y + b.h/2, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Items
    itemsRef.current.forEach(item => {
        ctx.font = '30px Arial';
        ctx.fillText(item.emoji || '⭐', item.x, item.y + 25);
    });

    // Draw Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 2.0 * dt;

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
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gray-900 flex flex-col items-center justify-center font-sans text-white">
      <div className="w-full max-w-2xl text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-blue-400">비행기</span> 슈팅 게임
        </h1>
        <p className="text-gray-400">짐가방 괴물을 물리치고 보스를 이기세요!</p>
      </div>

      <div className="relative w-full max-w-[500px] aspect-[3/4] bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-4 border-gray-700">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />

        {/* HUD */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full font-bold shadow-sm border border-white/10">
            🏆 {Math.floor(score)}
            </div>
            <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full font-bold shadow-sm border border-white/10 text-yellow-400">
            🔫 Lv.{weaponLevel}
            </div>
        </div>

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
            <div className="text-6xl mb-6 animate-pulse">✈️</div>
            <h2 className="text-2xl font-bold mb-2">출격 준비 완료!</h2>
            <p className="text-gray-400 mb-8 text-center px-4">
              화살표 키로 이동, 자동 발사됩니다.<br/>
              1분 뒤 보스가 나타납니다!
            </p>
            <Button size="lg" onClick={startGame} className="text-lg px-8 py-6 rounded-xl bg-blue-600 hover:bg-blue-700">
              게임 시작!
            </Button>
            <Button
                variant="outline"
                className="mt-4 bg-transparent text-white border-white hover:bg-white/20 hover:text-white"
                onClick={onBack}
            >
                메뉴로 나가기
            </Button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-sm z-10">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-3xl font-bold mb-2">격추되었습니다!</h2>
            <p className="text-xl mb-6">최종 점수: <span className="text-yellow-400 font-bold">{Math.floor(score)}</span></p>
            <Button size="lg" onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-black border-none text-lg px-8 py-6 rounded-xl">
              다시 도전하기
            </Button>
            <Button
                variant="outline"
                className="mt-4 bg-transparent text-white border-white hover:bg-white/20 hover:text-white"
                onClick={onBack}
            >
                메뉴로 나가기
            </Button>
          </div>
        )}

        {/* Victory Screen */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/80 backdrop-blur-sm z-10">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-bold mb-2">보스 격파 성공!</h2>
            <p className="text-gray-200 mb-6 text-center px-4">
              짐가방 괴물들의 대장을 물리쳤습니다!<br/>
              당신은 진정한 파일럿입니다.
            </p>
            <p className="text-xl mb-6">최종 점수: <span className="text-yellow-400 font-bold">{Math.floor(score)}</span></p>
            <Button size="lg" onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-black border-none text-lg px-8 py-6 rounded-xl">
              다시 도전하기
            </Button>
            <Button
                variant="outline"
                className="mt-4 bg-transparent text-white border-white hover:bg-white/20 hover:text-white"
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
          className="bg-gray-800 rounded-2xl shadow-md border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 active:bg-gray-700 flex items-center justify-center text-4xl select-none touch-manipulation"
          onMouseDown={() => handleTouchStart('left')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('left'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(); }}
        >
          ⬅️
        </button>
        <button
          className="bg-gray-800 rounded-2xl shadow-md border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 active:bg-gray-700 flex items-center justify-center text-4xl select-none touch-manipulation"
          onMouseDown={() => handleTouchStart('right')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('right'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(); }}
        >
          ➡️
        </button>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        PC: 방향키로 이동 | Mobile: 하단 버튼 터치
      </div>
    </div>
  );
}
