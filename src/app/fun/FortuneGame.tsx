'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

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
  { tier: 1, name: '우주를 관통하는 절대적 기적 (Absolute Miracle)', probability: 1 / 1000000000, probString: '1/1,000,000,000', color: 'text-red-600 font-extrabold' },
  { tier: 2, name: '하늘에서 떨어진 별조각 (Star Fragment)', probability: 1 / 100000000, probString: '1/100,000,000', color: 'text-purple-600 font-bold' },
  { tier: 3, name: '천년 묵은 산삼 (Millennium Ginseng)', probability: 1 / 10000000, probString: '1/10,000,000', color: 'text-pink-600 font-bold' },
  { tier: 4, name: '용이 남긴 비늘 (Dragon Scale)', probability: 1 / 1000000, probString: '1/1,000,000', color: 'text-orange-600 font-bold' },
  { tier: 5, name: '잃어버린 왕의 반지 (Lost King\'s Ring)', probability: 1 / 100000, probString: '1/100,000', color: 'text-yellow-600 font-bold' },
  { tier: 6, name: '행운의 네잎클로버 (Four-leaf Clover)', probability: 1 / 10000, probString: '1/10,000', color: 'text-green-600 font-bold' },
  { tier: 7, name: '오래된 은화 (Old Silver Coin)', probability: 1 / 1000, probString: '1/1,000', color: 'text-blue-600' },
  { tier: 8, name: '반짝이는 조약돌 (Shiny Pebble)', probability: 1 / 100, probString: '1/100', color: 'text-cyan-600' },
  { tier: 9, name: '길가에 핀 풀꽃 (Roadside Weed)', probability: 1 / 10, probString: '1/10', color: 'text-gray-600' },
  { tier: 10, name: '지나가는 바람 (Passing Wind)', probability: 1 / 2, probString: '1/2', color: 'text-gray-400' },
];

interface Props {
  onBack: () => void;
}

export default function FortuneGame({ onBack }: Props) {
  const [drawsLeft, setDrawsLeft] = useState(0);
  const [lastResult, setLastResult] = useState<FortuneTier | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showRankInput, setShowRankInput] = useState(false);

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

  const handleDraw = async () => {
    if (drawsLeft <= 0) {
      alert('오늘의 무료 뽑기 횟수를 모두 소진했습니다. 광고를 보고 충전하세요!');
      return;
    }
    if (isAnimating) return;

    setIsAnimating(true);
    setLastResult(null);
    setShowRankInput(false);

    // Simulate animation time
    setTimeout(() => {
      const rand = Math.random(); // 0.0 to 1.0
      let cumulative = 0;
      let result = TIERS[TIERS.length - 1]; // Default to worst

      // Check from rarest to most common? Or common to rarest?
      // Math.random() is uniform.
      // Since tiers overlap (1/2 includes 1/10 technically if we just do <),
      // we must be careful.
      // Wait, probabilities are usually exclusive or cumulative?
      // The prompt said "1/2 down to 1/1B".
      // If I roll 0.0000000001, that satisfies < 0.5 and < 0.1 etc.
      // So we should check from smallest probability (Tier 1) to largest (Tier 10).

      for (const tier of TIERS) {
        if (rand < tier.probability) {
          result = tier;
          break; // Found the rarest matching tier
        }
      }

      // If random was 0.6, it matches none (since max is 0.5).
      // In that case, it is "Bad Luck" (The remaining 50% roughly).
      // Wait, the prompt implies these ARE the outcomes.
      // "1/2" implies 50% chance.
      // If none match, let's say it's just a generic "Fail" or default to Tier 10?
      // Tier 10 is 50%. So 50% chance to get at least Tier 10.
      // If rand > 0.5, user gets nothing? Or "Bad Luck"?
      // Let's add a "Tier 11" or handle "Fail" explicitly.
      // But the prompt said "10등급...". I'll treat > 0.5 as "Tier 10" or "Bad Luck".
      // Let's act as if Tier 10 covers the rest for simplicity, OR make it explicit.
      // User said: "10등급 | 1/2 | 50% | 지나가는 바람".
      // I will assume if rand > 0.5, it is "꽝" (Fail).

      const finalResult = (rand > 0.5) ? null : result;

      setLastResult(finalResult);
      saveDraws(drawsLeft - 1);
      setIsAnimating(false);

      if (finalResult && finalResult.tier <= 6) {
        // Ask for ranking registration
        setShowRankInput(true);
      }
    }, 1500); // 1.5s animation
  };

  const handleRegisterRank = async () => {
    if (!lastResult || !playerName.trim()) return;

    try {
      const res = await fetch('/api/fortune/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName,
          tier: lastResult.tier,
          prizeName: lastResult.name,
          probability: lastResult.probString
        })
      });

      if (res.ok) {
        alert('랭킹에 등록되었습니다!');
        setShowRankInput(false);
        setPlayerName('');
        fetchRankings();
      } else {
        alert('등록 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
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
    <div className="min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="max-w-md mx-auto relative">
        <button onClick={onBack} className="absolute left-0 top-0 p-2 text-gray-400 hover:text-white">
          &larr; 뒤로가기
        </button>
        <h1 className="text-3xl font-bold text-center mt-8 mb-2 text-yellow-400">🔮 운세 가챠</h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          10억분의 1 확률에 도전하세요!
        </p>

        {/* Machine Visual */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700 text-center mb-6 relative overflow-hidden">
          <div className="mb-6">
            <div className={`text-6xl mb-4 transition-transform duration-500 ${isAnimating ? 'animate-bounce' : ''}`}>
              {lastResult ? '🎁' : '🎱'}
            </div>
            <div className="min-h-[6rem] flex flex-col items-center justify-center">
              {isAnimating ? (
                <p className="text-xl text-yellow-300 animate-pulse">운명을 읽는 중...</p>
              ) : lastResult ? (
                <>
                  <p className="text-sm text-gray-400 mb-1">당신의 운세는...</p>
                  <h2 className={`text-2xl ${lastResult.color} mb-1`}>{lastResult.name}</h2>
                  <p className="text-xs text-gray-500">확률: {lastResult.probString}</p>
                </>
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
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-full shadow-lg text-lg"
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

          {/* Rank Input Modal Overlay */}
          {showRankInput && (
             <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-20">
               <h3 className="text-xl font-bold text-yellow-400 mb-4">🎉 축하합니다! 랭킹 등록!</h3>
               <p className="text-white mb-4 text-center">
                 <span className="font-bold text-lg">{lastResult?.name}</span><br/>
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
                 <Button onClick={handleRegisterRank} className="flex-1 bg-yellow-600 text-white">등록</Button>
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
                <div key={rank._id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center text-sm">
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
