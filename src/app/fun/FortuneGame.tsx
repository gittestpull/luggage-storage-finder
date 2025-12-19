'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

interface User {
  username: string;
  points: number;
}

interface RankingItem {
  _id: string;
  name: string;
  tier: number;
  prizeName: string;
  probability: string;
  createdAt: string;
}

interface FortuneTier {
  tier: number;
  name: string;
  probability: number; // 0 to 1
  probString: string;
  color: string;
}

const TIERS: FortuneTier[] = [
  { tier: 1, name: '우주를 관통하는 절대적 기적 (Absolute Miracle)', probability: 1 / 100000000, probString: '1/100,000,000', color: 'text-red-600 font-extrabold' },
  { tier: 2, name: '천년 묵은 산삼 (Millennium Ginseng)', probability: 1 / 10000000, probString: '1/10,000,000', color: 'text-purple-600 font-bold' },
  { tier: 3, name: '용이 남긴 비늘 (Dragon Scale)', probability: 1 / 1000000, probString: '1/1,000,000', color: 'text-pink-600 font-bold' },
  { tier: 4, name: '잃어버린 왕의 반지 (Lost King\'s Ring)', probability: 1 / 100000, probString: '1/100,000', color: 'text-orange-600 font-bold' },
  { tier: 5, name: '행운의 네잎클로버 (Four-leaf Clover)', probability: 1 / 10000, probString: '1/10,000', color: 'text-yellow-600 font-bold' },
  { tier: 6, name: '오래된 은화 (Old Silver Coin)', probability: 1 / 1000, probString: '1/1,000', color: 'text-green-600 font-bold' },
  { tier: 7, name: '반짝이는 조약돌 (Shiny Pebble)', probability: 1 / 100, probString: '1/100', color: 'text-blue-600' },
];

interface Props {
  onBack: () => void;
  user: User | null;
}

// Advanced Confetti with Fireworks
const Confetti = ({ intense = false }: { intense?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // --- Particle System ---
    const particles: any[] = [];
    const fireworks: any[] = [];

    const colors = intense
      ? ['#FFD700', '#FF0000', '#FFFFFF', '#00FFFF', '#FF00FF', '#00FF00', '#FFA500']
      : ['#FFD700', '#C0C0C0', '#FFFFFF', '#87CEEB'];

    // Helper: Create a standard falling particle
    const createParticle = (x: number, y: number, color: string, speedMult: number = 1) => {
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 4 * speedMult,
        vy: (Math.random() * 3 + 1) * speedMult,
        color,
        size: Math.random() * (intense ? 6 : 4) + 2,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        type: 'confetti'
      };
    };

    // Helper: Create a firework explosion particle
    const createSpark = (x: number, y: number, color: string) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        type: 'spark'
      };
    };

    // Initial Confetti Burst
    const burstCount = intense ? 400 : 150;
    for (let i = 0; i < burstCount; i++) {
      particles.push(createParticle(
        Math.random() * canvas.width,
        Math.random() * canvas.height - canvas.height,
        colors[Math.floor(Math.random() * colors.length)]
      ));
    }

    let animationId: number;
    let frames = 0;

    const draw = () => {
      // Fade out trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update Fireworks (Rockets)
      if (intense && frames % 40 === 0) { // Launch every ~0.6s
         fireworks.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            targetY: canvas.height * 0.2 + Math.random() * (canvas.height * 0.5),
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 3 + 8),
            type: 'rocket'
         });
      }

      // Render Fireworks Logic
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.1; // Gravity on rocket

        // Draw Rocket
        ctx.beginPath();
        ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();

        // Explode condition
        if (f.vy >= 0 || f.y <= f.targetY) {
           // Boom!
           for (let j = 0; j < 50; j++) {
              particles.push(createSpark(f.x, f.y, f.color));
           }
           fireworks.splice(i, 1);
        }
      }

      // Update Particles (Confetti + Sparks)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.type === 'spark') {
           p.x += p.vx;
           p.y += p.vy;
           p.vy += 0.1; // Gravity
           p.alpha -= p.decay;
           if (p.alpha <= 0) {
             particles.splice(i, 1);
             continue;
           }
           ctx.globalAlpha = p.alpha;
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
           ctx.fillStyle = p.color;
           ctx.fill();
           ctx.globalAlpha = 1;
        } else {
           // Confetti
           p.x += p.vx;
           p.y += p.vy;
           p.rotation += p.rotationSpeed;

           if (p.y > canvas.height) {
              if (intense) { // Loop confetti for intense mode
                  p.y = -20;
                  p.x = Math.random() * canvas.width;
              } else {
                 // Remove if not looping (or make loop?)
                 // Let's loop for simple mode too but less frequent
                 p.y = -20;
                 p.x = Math.random() * canvas.width;
              }
           }

           ctx.save();
           ctx.translate(p.x, p.y);
           ctx.rotate((p.rotation * Math.PI) / 180);
           ctx.fillStyle = p.color;
           ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
           ctx.restore();
        }
      }

      frames++;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Stop after 7 seconds (longer for fireworks)
    const timer = setTimeout(() => cancelAnimationFrame(animationId), 7000);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      clearTimeout(timer);
    };
  }, [intense]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};

export default function FortuneGame({ onBack, user }: Props) {
  const [drawsLeft, setDrawsLeft] = useState(0);
  const [lastResult, setLastResult] = useState<FortuneTier | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showRankInput, setShowRankInput] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [effectIntensity, setEffectIntensity] = useState(false);
  const [autoRegistered, setAutoRegistered] = useState(false);

  // Initialize state from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('fortune_last_date');
    const storedDraws = localStorage.getItem('fortune_draws');

    if (storedDate !== today) {
      // New day, reset
      setDrawsLeft(10);
      localStorage.setItem('fortune_last_date', today);
      localStorage.setItem('fortune_draws', '10');
    } else {
      setDrawsLeft(storedDraws ? parseInt(storedDraws) : 10);
    }

    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/fortune/ranking');
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch (err) {
      console.error('Failed to load rankings', err);
    }
  };

  const saveDraws = (count: number) => {
    setDrawsLeft(count);
    localStorage.setItem('fortune_draws', count.toString());
  };

  const registerRanking = async (name: string, tier: number, prizeName: string, probability: string) => {
    try {
      const res = await fetch('/api/fortune/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tier,
          prizeName,
          probability
        })
      });

      if (res.ok) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleDraw = async () => {
    if (drawsLeft <= 0) {
      alert('오늘의 무료 뽑기 횟수를 모두 소진했습니다. 광고를 보고 충전하세요!');
      return;
    }
    if (isAnimating) return;

    setIsAnimating(true);
    setLastResult(null);
    setShowRankInput(false);
    setShowConfetti(false);
    setAutoRegistered(false);

    // Simulate animation time
    setTimeout(async () => {
      const rand = Math.random();
      let result = null;

      // New Strict Logic: Only return a tier if rand < tier.probability
      // TIERS are sorted by probability (smallest to largest: 1/100M -> 1/100)
      for (const tier of TIERS) {
        if (rand < tier.probability) {
          result = tier;
          break; // Found the rarest matching tier
        }
      }

      // If rand > largest tier prob (0.01), result is null (Fail)
      const finalResult = result;

      setLastResult(finalResult);
      saveDraws(drawsLeft - 1);
      setIsAnimating(false);

      if (finalResult) {
        // Trigger effects
        // Tiers are 1 to 7 now.
        // Let's say Top 3 are intense.
        setEffectIntensity(finalResult.tier <= 3);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 7000);

        // Ranking Logic: All wins (<= 1/100) are ranked?
        // User asked "100부터...". Maybe all of them?
        // Let's allow ranking for all "Wins" since getting even 1/100 is now a "Win" vs 99% Fail.

        if (user) {
          const success = await registerRanking(user.username, finalResult.tier, finalResult.name, finalResult.probString);
          if (success) {
            setAutoRegistered(true);
            fetchRankings();
          }
        } else {
          setShowRankInput(true);
        }
      }
    }, 1500);
  };

  const handleManualRegister = async () => {
    if (!lastResult || !playerName.trim()) return;
    const success = await registerRanking(playerName, lastResult.tier, lastResult.name, lastResult.probString);
    if (success) {
      alert('랭킹에 등록되었습니다!');
      setShowRankInput(false);
      setPlayerName('');
      fetchRankings();
    } else {
      alert('등록 실패');
    }
  };

  const startAd = () => {
    setShowAdModal(true);
    setAdTimer(5); // 5 seconds
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAdModal && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    } else if (showAdModal && adTimer === 0) {
      // Ad finished
      setTimeout(() => {
        saveDraws(drawsLeft + 10);
        setShowAdModal(false);
        alert('광고 시청 완료! 뽑기 횟수 10회가 충전되었습니다.');
      }, 500);
    }
    return () => clearInterval(interval);
  }, [showAdModal, adTimer, drawsLeft]);

  return (
    <div className={`min-h-screen p-4 font-sans transition-colors duration-1000 ${
      showConfetti && effectIntensity ? 'bg-indigo-950' : 'bg-gray-900'
    } text-white`}>
      {/* Confetti Effect */}
      {showConfetti && <Confetti intense={effectIntensity} />}

      <div className="max-w-md mx-auto relative z-10">
        <button onClick={onBack} className="absolute left-0 top-0 p-2 text-gray-400 hover:text-white">
          &larr; 뒤로가기
        </button>
        <h1 className="text-3xl font-bold text-center mt-8 mb-2 text-yellow-400">🔮 운세 가챠</h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          1억분의 1 확률에 도전하세요!
        </p>

        {/* Machine Visual */}
        <div className={`
           rounded-xl p-6 shadow-2xl border text-center mb-6 relative overflow-hidden transition-all duration-500
           ${showConfetti && effectIntensity ? 'bg-gray-800 border-yellow-500 shadow-yellow-500/50 scale-105' : 'bg-gray-800 border-gray-700'}
        `}>
          <div className="mb-6">
            <div className={`text-6xl mb-4 transition-transform duration-500 ${isAnimating ? 'animate-bounce' : ''}`}>
              {lastResult ? '🎁' : '🎱'}
            </div>
            <div className="min-h-[6rem] flex flex-col items-center justify-center">
              {isAnimating ? (
                <p className="text-xl text-yellow-300 animate-pulse">운명을 읽는 중...</p>
              ) : lastResult ? (
                <div className={`${showConfetti ? 'animate-pulse' : ''}`}>
                  <p className="text-sm text-gray-400 mb-1">당신의 운세는...</p>
                  <h2 className={`text-2xl ${lastResult.color} mb-1 ${effectIntensity ? 'text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]' : ''}`}>
                    {lastResult.name}
                  </h2>
                  <p className="text-xs text-gray-500">확률: {lastResult.probString}</p>

                  {/* Auto-registered message for logged-in users */}
                  {autoRegistered && (
                    <div className="mt-2 text-green-400 font-bold animate-bounce text-sm border border-green-500 rounded px-2 py-1 inline-block">
                      ✨ 랭킹에 자동 등록되었습니다! ({user?.username})
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">
                  {lastResult === null && !isAnimating && drawsLeft < 10 && drawsLeft >= 0 ? '꽝! (Bad Luck ☁️)' : '버튼을 눌러 운세를 뽑아보세요!'}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleDraw}
              disabled={isAnimating || drawsLeft <= 0}
              className={`w-full font-bold py-4 rounded-full shadow-lg text-lg transition-all
                ${effectIntensity
                  ? 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'}
                text-white
              `}
            >
              {isAnimating ? '뽑는 중...' : `운세 뽑기 (남은 횟수: ${drawsLeft})`}
            </Button>

            {drawsLeft <= 0 && (
              <Button
                onClick={startAd}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-full"
              >
                📺 광고 보고 충전하기 (+10회)
              </Button>
            )}
          </div>

          {/* Rank Input Modal Overlay (Only for non-logged-in users) */}
          {showRankInput && (
             <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-20 animate-fade-in">
               <h3 className="text-xl font-bold text-yellow-400 mb-4 animate-bounce">🎉 축하합니다! 랭킹 등록!</h3>
               <p className="text-white mb-4 text-center">
                 <span className={`font-bold text-lg ${lastResult?.color}`}>{lastResult?.name}</span><br/>
                 을(를) 뽑으셨군요!
               </p>
               <input
                 type="text"
                 placeholder="닉네임 입력 (최대 10자)"
                 maxLength={10}
                 className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 mb-4"
                 value={playerName}
                 onChange={(e) => setPlayerName(e.target.value)}
               />
               <div className="flex gap-2 w-full">
                 <Button onClick={() => setShowRankInput(false)} className="flex-1 bg-gray-600">취소</Button>
                 <Button onClick={handleManualRegister} className="flex-1 bg-yellow-600 text-white">등록</Button>
               </div>
             </div>
          )}
        </div>

        {/* Ad Modal */}
        {showAdModal && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div className="text-white text-center">
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <h2 className="text-2xl font-bold mb-2">광고 시청 중...</h2>
              <p className="text-gray-400">잠시만 기다려주세요 ({adTimer}초)</p>
            </div>
          </div>
        )}

        {/* Ranking Board */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🏆 명예의 전당 (Top 50)
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {rankings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">아직 당첨자가 없습니다. 첫 주인공이 되어보세요!</p>
            ) : (
              rankings.map((rank) => (
                <div key={rank._id} className={`p-3 rounded-lg flex justify-between items-center text-sm ${rank.tier <= 3 ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-gray-700/50'}`}>
                  <div>
                    <span className="font-bold text-yellow-400 mr-2">
                      {rank.tier === 1 ? '🥇' : rank.tier === 2 ? '🥈' : rank.tier === 3 ? '🥉' : '🏅'}
                    </span>
                    <span className="text-white font-medium">{rank.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                       rank.tier <= 3 ? 'text-purple-400' : 'text-blue-300'
                    }`}>{rank.prizeName}</div>
                    <div className="text-xs text-gray-500">{rank.probability}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
