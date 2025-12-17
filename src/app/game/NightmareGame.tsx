'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Types
type Entity = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type Player = Entity & {
  hp: number;
  maxHp: number;
  str: number;
  speed: number;
  weaponLevel: number; // Affects fire rate or projectile count
};

type Enemy = Entity & {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  type: 'zombie' | 'boss';
};

type Projectile = Entity & {
  vx: number;
  vy: number;
  damage: number;
  life: number; // Seconds
};

type Item = Entity & {
  type: 'potion_hp' | 'potion_str' | 'weapon';
  value: number;
  life: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;

};

interface Props {
  onBack?: () => void;
}

export default function NightmareGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React State for UI
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'won'>('playing');
  const [day, setDay] = useState(1);
  const [stats, setStats] = useState({ hp: 100, maxHp: 100, str: 3, level: 1 });
  const [score, setScore] = useState(0);

  // We use refs for game state to avoid closure staleness in the loop
  const gameStateRef = useRef({
    playing: true,
    day: 1,
    time: 0,
    score: 0,
    player: {
      id: 0,
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      color: '#3b82f6',
      hp: 100,
      maxHp: 100,
      str: 3,
      speed: 180,
      weaponLevel: 1,
    } as Player,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    items: [] as Item[],
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    lastFireTime: 0,
    lastSpawnTime: 0,
    spawnInterval: 1.0, // Initial spawn rate
    joystick: {
      active: false,
      identifier: null as number | null,
      originX: 0,
      originY: 0,
      currentX: 0,
      currentY: 0,
      dx: 0,
      dy: 0,

    },
    targetId: null as number | null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Player Position
    gameStateRef.current.player.x = window.innerWidth / 2;
    gameStateRef.current.player.y = window.innerHeight / 2;

    // Constants
    const MAX_DAYS = 100;
    const SEC_PER_DAY = 15; // 15 seconds per day

    let animationFrameId: number;
    let lastTime = performance.now();
    let uniqueIdCounter = 1;

    const getUniqueId = () => uniqueIdCounter++;

    // Input Handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      gameStateRef.current.keys[e.key] = true;

      // Switch Target on Spacebar
      if (e.key === ' ') {
        const state = gameStateRef.current;
        const p = state.player;
        // Find visible enemies
        const targets = state.enemies.filter(en => {
          const dist = Math.sqrt(Math.pow(en.x - p.x, 2) + Math.pow(en.y - p.y, 2));
          return dist < 400; // Range matches shooting range
        }).sort((a, b) => {
          const da = Math.pow(a.x - p.x, 2) + Math.pow(a.y - p.y, 2);
          const db = Math.pow(b.x - p.x, 2) + Math.pow(b.y - p.y, 2);
          return da - db;
        });

        if (targets.length > 0) {
          if (state.targetId === null) {
            state.targetId = targets[0].id;
          } else {
            const idx = targets.findIndex(t => t.id === state.targetId);
            const nextIdx = (idx + 1) % targets.length;
            state.targetId = targets[nextIdx].id;
          }
        } else {
          state.targetId = null;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = false;
    };

    // Touch Handling (Virtual Joystick & Tap to Target)
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const state = gameStateRef.current;

      // Screen Half Split
      // Left Half: Joystick
      if (touch.clientX < window.innerWidth / 2) {
        if (!state.joystick.active) {
          state.joystick.active = true;
          state.joystick.identifier = touch.identifier;
          state.joystick.originX = touch.clientX;
          state.joystick.originY = touch.clientY;
          state.joystick.currentX = touch.clientX;
          state.joystick.currentY = touch.clientY;
          state.joystick.dx = 0;
          state.joystick.dy = 0;
        }
      } else {
        // Right Half: Switch Target
        const p = state.player;
        const targets = state.enemies.filter(en => {
          const dist = Math.sqrt(Math.pow(en.x - p.x, 2) + Math.pow(en.y - p.y, 2));
          return dist < 400;
        }).sort((a, b) => {
          const da = Math.pow(a.x - p.x, 2) + Math.pow(a.y - p.y, 2);
          const db = Math.pow(b.x - p.x, 2) + Math.pow(b.y - p.y, 2);
          return da - db;
        });

        if (targets.length > 0) {
          if (state.targetId === null) {
            state.targetId = targets[0].id;
          } else {
            const idx = targets.findIndex(t => t.id === state.targetId);
            const nextIdx = (idx + 1) % targets.length;
            state.targetId = targets[nextIdx].id;
          }
        } else {
          state.targetId = null;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const state = gameStateRef.current;
      if (!state.joystick.active) return;

      // Find the touch that started the joystick
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === state.joystick.identifier) {
          const touch = e.changedTouches[i];
          state.joystick.currentX = touch.clientX;
          state.joystick.currentY = touch.clientY;

          // Calculate delta
          const maxDist = 50; // Max joystick radius
          let deltaX = touch.clientX - state.joystick.originX;
          let deltaY = touch.clientY - state.joystick.originY;
          const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          // Clamp distance
          if (dist > maxDist) {
            deltaX = (deltaX / dist) * maxDist;
            deltaY = (deltaY / dist) * maxDist;
          }

          // Normalize output (-1 to 1)
          state.joystick.dx = deltaX / maxDist;
          state.joystick.dy = deltaY / maxDist;
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const state = gameStateRef.current;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === state.joystick.identifier) {
          state.joystick.active = false;
          state.joystick.identifier = null;
          state.joystick.dx = 0;
          state.joystick.dy = 0;
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Resize Handling
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Clamp player to screen
      const p = gameStateRef.current.player;
      p.x = Math.max(p.width, Math.min(canvas.width - p.width, p.x));
      p.y = Math.max(p.height, Math.min(canvas.height - p.height, p.y));
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Helper: Distance
    const getDistance = (e1: { x: number, y: number }, e2: { x: number, y: number }) => {
      return Math.sqrt(Math.pow(e2.x - e1.x, 2) + Math.pow(e2.y - e1.y, 2));
    };

    // Helper: Spawn Enemy
    const spawnEnemy = (isBoss = false) => {
      const edge = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
      let ex = 0, ey = 0;
      const size = isBoss ? 60 : 24;

      if (edge === 0) { ex = Math.random() * canvas.width; ey = -size; }
      else if (edge === 1) { ex = canvas.width + size; ey = Math.random() * canvas.height; }
      else if (edge === 2) { ex = Math.random() * canvas.width; ey = canvas.height + size; }
      else { ex = -size; ey = Math.random() * canvas.height; }

      const dayFactor = gameStateRef.current.day;
      const baseHp = isBoss ? 5000 : 10 + (dayFactor * 2);
      const baseSpeed = isBoss ? 80 : 50 + (dayFactor * 0.5);

      const enemy: Enemy = {
        id: getUniqueId(),
        x: ex,
        y: ey,
        width: size,
        height: size,
        color: isBoss ? '#ef4444' : '#10b981', // Red for boss, Green for zombies
        hp: baseHp,
        maxHp: baseHp,
        damage: isBoss ? 20 : 5 + Math.floor(dayFactor / 10),
        speed: baseSpeed,
        type: isBoss ? 'boss' : 'zombie'
      };
      gameStateRef.current.enemies.push(enemy);
    };

    // Helper: Spawn Item
    const spawnItem = (x: number, y: number) => {
      const rand = Math.random();
      let type: Item['type'] = 'potion_hp';
      let color = '#ef4444'; // red

      if (rand < 0.6) {
        // 60% HP
        type = 'potion_hp';
        color = '#ef4444';
      } else if (rand < 0.9) {
        // 30% STR
        type = 'potion_str';
        color = '#3b82f6';
      } else {
        // 10% Weapon
        type = 'weapon';
        color = '#fbbf24';
      }

      gameStateRef.current.items.push({
        id: getUniqueId(),
        x, y,
        width: 15,
        height: 15,
        color,
        type,
        value: 10,
        life: 15 // Disappear after 15s
      });
    };

    // Helper: Particles
    const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100;
        gameStateRef.current.particles.push({
          id: getUniqueId(),
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5,
          color,
          size: Math.random() * 4 + 2
        });
      }
    };

    // --- GAME LOOP ---
    const update = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      const state = gameStateRef.current;
      if (!state.playing) return;

      // Update Time & Day
      state.time += dt;
      const newDay = Math.min(MAX_DAYS, Math.floor(state.time / SEC_PER_DAY) + 1);

      if (newDay !== state.day) {
        state.day = newDay;
        setDay(newDay);
        // Difficulty ramp up: Spawn faster
        state.spawnInterval = Math.max(0.1, 1.0 - (state.day * 0.008));

        // Spawn Boss at Day 100
        if (state.day === 100) {
          spawnEnemy(true);
        }
      }

      // 1. Player Movement
      const keys = state.keys;
      let dx = 0, dy = 0;
      if (keys['w'] || keys['ArrowUp']) dy -= 1;
      if (keys['s'] || keys['ArrowDown']) dy += 1;
      if (keys['a'] || keys['ArrowLeft']) dx -= 1;
      if (keys['d'] || keys['ArrowRight']) dx += 1;

      // Add Joystick Input
      if (state.joystick.active) {
        dx += state.joystick.dx;
        dy += state.joystick.dy;
      }

      // Normalize if length > 1 (to prevent super speed)
      // If purely joystick (e.g. 0.5), keep it slow (analog control)
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        // If greater than 1, normalize. If less than 1, keep magnitude (allow slow walk).
        const scale = len > 1 ? 1 / len : 1;

        state.player.x += (dx * scale) * state.player.speed * dt;
        state.player.y += (dy * scale) * state.player.speed * dt;

        // Boundaries
        state.player.x = Math.max(10, Math.min(canvas.width - 10, state.player.x));
        state.player.y = Math.max(10, Math.min(canvas.height - 10, state.player.y));
      }

      // 2. Player Shooting (Auto)
      const fireRate = Math.max(0.1, 0.5 - (state.player.weaponLevel * 0.05));
      if (state.time - state.lastFireTime > fireRate) {
        // Find nearest enemy or locked target
        let target: Enemy | null = null;

        // Try locked target first
        if (state.targetId !== null) {
          const locked = state.enemies.find(e => e.id === state.targetId);
          if (locked) {
            const d = getDistance(state.player, locked);
            if (d < 400) {
              target = locked;
            } else {
              state.targetId = null; // Lost range
            }
          } else {
            state.targetId = null; // Dead
          }
        }

        // Fallback to nearest if no valid lock
        if (!target) {
          let minDist = Infinity;
          for (const enemy of state.enemies) {
            const d = getDistance(state.player, enemy);
            if (d < minDist) {
              minDist = d;
              target = enemy;
            }
          }
          // Verify range
          if (target && minDist >= 400) target = null;
        }

        if (target) {
          state.lastFireTime = state.time;
          const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
          const speed = 400;
          state.projectiles.push({
            id: getUniqueId(),
            x: state.player.x,
            y: state.player.y,
            width: 8,
            height: 8,
            color: '#ffff00',
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: state.player.str,
            life: 2
          });
        }
      }

      // 3. Spawning Enemies
      if (state.time - state.lastSpawnTime > state.spawnInterval) {
        state.lastSpawnTime = state.time;
        // Spawn count increases slightly with day
        const count = 1 + Math.floor(state.day / 20);
        for (let i = 0; i < count; i++) spawnEnemy();
      }

      // 4. Update Projectiles
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        // Check collision with enemies
        let hit = false;
        for (const enemy of state.enemies) {
          if (getDistance(p, enemy) < (p.width + enemy.width) / 2) {
            enemy.hp -= p.damage;
            hit = true;
            spawnParticles(enemy.x, enemy.y, enemy.color, 3);
            break;
          }
        }

        if (p.life <= 0 || hit) {
          state.projectiles.splice(i, 1);
        }
      }

      // 5. Update Enemies
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        // Move towards player
        const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed * dt;
        enemy.y += Math.sin(angle) * enemy.speed * dt;

        // Collision with Player
        if (getDistance(enemy, state.player) < (enemy.width + state.player.width) / 2) {
          // Take damage
          state.player.hp -= enemy.damage * dt; // Damage per second roughly if overlapping?
          // Actually let's do continuous damage but check intervals or just raw float subtraction
          // To make it punchy, maybe knockback?
          // Simple: continuous drain

          if (state.player.hp <= 0) {
            state.playing = false;
            setGameState('gameover');
          }
        }

        // Death
        if (enemy.hp <= 0) {
          state.enemies.splice(i, 1);
          state.score += 10;
          setScore(state.score); // This triggers re-render often, careful. Maybe debounce or just show on death screen.
          // Actually, let's only set score occasionally or just read from ref in UI

          spawnParticles(enemy.x, enemy.y, '#ffffff', 5);

          // Drop item?
          if (Math.random() < 0.2) { // 20% chance
            spawnItem(enemy.x, enemy.y);
          }

          // If boss died
          if (enemy.type === 'boss') {
            state.playing = false;
            setGameState('won');
          }
        }
      }

      // 6. Update Items
      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        item.life -= dt;

        // Magnetic pull if close
        const dist = getDistance(item, state.player);
        if (dist < 100) {
          item.x += (state.player.x - item.x) * 5 * dt;
          item.y += (state.player.y - item.y) * 5 * dt;
        }

        if (dist < state.player.width + item.width) {
          // Pickup
          if (item.type === 'potion_hp') {
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20);
          } else if (item.type === 'potion_str') {
            state.player.str += 1;
          } else if (item.type === 'weapon') {
            state.player.weaponLevel += 1;
          }
          state.items.splice(i, 1);
        } else if (item.life <= 0) {
          state.items.splice(i, 1);
        }
      }

      // 7. Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // Sync React State for HUD (Throttled to update only every 10 frames ~ 6 times per sec)
      if (timestamp % 10 < 1) { // Simple modulo check on timestamp isn't reliable, let's use a counter or timer check
        // Actually better: only update if changed significantly or timer
      }

      // Better approach: Update HUD state every 100ms
      if (timestamp - lastTime > 0) { // logic tick
        // We are already inside update loop
      }

      // Let's use a frame counter in ref to throttle UI updates
      // Using modulo on frame ID or just a timer accumulator
      // We don't have frame ID exposed here easily without adding to stateRef
      // Let's just use time check
      const lastUiUpdate = (state as any).lastUiUpdate || 0;
      if (timestamp - lastUiUpdate > 100) { // 100ms
        (state as any).lastUiUpdate = timestamp;
        setStats(prev => {
          const newHp = Math.ceil(state.player.hp);
          // Only trigger render if values changed
          if (prev.hp !== newHp || prev.str !== state.player.str || prev.level !== state.player.weaponLevel) {
            return {
              hp: newHp,
              maxHp: state.player.maxHp,
              str: state.player.str,
              level: state.player.weaponLevel
            };
          }
          return prev;
        });
      }

      // --- RENDER ---
      // Clear
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      const gridSize = 100;
      // Parallax effect? Nah, just static grid
      for (let x = 0; x < canvas.width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      // Items
      state.items.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.width / 2, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = item.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Enemies
      state.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        // Simple shape: Square for zombie
        ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);

        // Health bar above enemy
        const hpPct = enemy.hp / enemy.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2 - 8, enemy.width, 4);
        ctx.fillStyle = 'lime';
        ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2 - 8, enemy.width * hpPct, 4);

        // Target Reticle
        if (state.targetId === enemy.id) {
          ctx.strokeStyle = '#ffff00'; // Yellow reticle
          ctx.lineWidth = 2;
          ctx.beginPath();
          const r = enemy.width;
          ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshair lines
          ctx.beginPath();
          ctx.moveTo(enemy.x - r - 5, enemy.y);
          ctx.lineTo(enemy.x + r + 5, enemy.y);
          ctx.moveTo(enemy.x, enemy.y - r - 5);
          ctx.lineTo(enemy.x, enemy.y + r + 5);
          ctx.stroke();
        }
      });

      // Player
      ctx.fillStyle = state.player.color;
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, state.player.width / 2, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#ffccaa';
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y - 5, 6, 0, Math.PI * 2);
      ctx.fill();

      // Projectiles
      state.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width / 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Particles
      state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life < 0.5 ? p.life * 2 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw Virtual Joystick
      // The `state` variable is already defined as `stateRef.current` at the beginning of the update function.
      // So we can directly use `state.joystick`.
      if (state.joystick.active) {
        const { originX, originY, currentX, currentY } = state.joystick;
        const maxDist = 50;

        // Base
        ctx.beginPath();
        ctx.arc(originX, originY, maxDist, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Stick
        // Calculate stick position (clamped)
        let deltaX = currentX - originX;
        let deltaY = currentY - originY;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (dist > maxDist) {
          deltaX = (deltaX / dist) * maxDist;
          deltaY = (deltaY / dist) * maxDist;
        }

        ctx.beginPath();
        ctx.arc(originX + deltaX, originY + deltaY, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Run once on mount

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans select-none">
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
        <div className="flex flex-col gap-1 bg-black/50 p-2 rounded backdrop-blur-sm">
          <div className="text-3xl font-bold text-yellow-400 drop-shadow-md">DAY {day} <span className="text-sm text-gray-300">/ 100</span></div>
          <div className="text-xl">HP: <span className="text-red-500 font-bold">{stats.hp}</span> / {stats.maxHp}</div>
          <div className="text-lg">STR: <span className="text-blue-400 font-bold">{stats.str}</span></div>
          <div className="text-lg">WEAPON LV: <span className="text-orange-400 font-bold">{stats.level}</span></div>
          <div className="text-lg text-gray-400">SCORE: {score}</div>
        </div>



        {onBack ? (
          <button
            onClick={onBack}
            className="pointer-events-auto bg-gray-800/80 px-4 py-2 rounded hover:bg-gray-700 text-white font-bold backdrop-blur-sm transition"
          >
            EXIT
          </button>
        ) : (
          <Link href="/" className="pointer-events-auto bg-gray-800/80 px-4 py-2 rounded hover:bg-gray-700 text-white font-bold backdrop-blur-sm transition">
            EXIT
          </Link>
        )}
      </div>

      <canvas ref={canvasRef} className="block cursor-crosshair" />

      {/* Overlays */}
      {
        gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 animate-in fade-in duration-500">
            <div className="text-center p-8 bg-gray-900 border-2 border-red-600 rounded-xl shadow-2xl">
              <h2 className="text-6xl font-black text-red-600 mb-2">YOU DIED</h2>
              <p className="text-2xl text-gray-300 mb-8">Survived until Day {day}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-red-600 text-white text-2xl font-bold rounded hover:bg-red-700 transition transform hover:scale-105"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        )
      }

      {
        gameState === 'won' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 animate-in fade-in duration-500">
            <div className="text-center p-8 bg-gray-900 border-2 border-yellow-400 rounded-xl shadow-2xl">
              <h2 className="text-6xl font-black text-yellow-400 mb-2">VICTORY!</h2>
              <p className="text-2xl text-gray-300 mb-8">The 100 Days Nightmare is Over.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-yellow-500 text-black text-2xl font-bold rounded hover:bg-yellow-400 transition transform hover:scale-105"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
}
