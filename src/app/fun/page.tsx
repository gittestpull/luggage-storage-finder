'use client';

import { useState, useEffect } from 'react';
import JumpGame from './JumpGame';
import ShootingGame from './ShootingGame';
import FortuneGame from './FortuneGame';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

interface GameConfig {
  gameId: string;
  name: string;
  isPaid: boolean;
  cost: number;
}

export default function FunPage() {
  const [activeGame, setActiveGame] = useState<'jump' | 'shooting' | 'fortune' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, openModal, login } = useAuth();
  const [loadingGame, setLoadingGame] = useState(false);
  const [gameConfigs, setGameConfigs] = useState<GameConfig[]>([]);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => setGameConfigs(data))
      .catch(err => console.error('Failed to load game configs', err));
  }, []);

  const getGameConfig = (gameId: string) => gameConfigs.find(g => g.gameId === gameId);

  const handleStartGame = async (gameType: 'jump' | 'shooting' | 'fortune') => {
    // Fortune Game has its own logic for cost/limits
    if (gameType === 'fortune') {
      setActiveGame(gameType);
      return;
    }

    const config = getGameConfig(gameType);
    const isPaid = config?.isPaid ?? true;
    const cost = config?.cost ?? 10;

    if (isPaid) {
      if (!user) {
        if (confirm('이 게임은 로그인이 필요합니다. 로그인 하시겠습니까?')) {
          openModal('login');
        }
        return;
      }

      if (user.points < cost) {
        alert(`포인트가 부족합니다. (필요 포인트: ${cost} P)`);
        return;
      }

      if (!confirm(`게임 시작 시 ${cost} 포인트가 차감됩니다. 시작하시겠습니까?`)) {
        return;
      }
    }

    setLoadingGame(true);
    try {
      if (isPaid) {
        const response = await fetch('/api/game/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: gameType })
        });
        const data = await response.json();

        if (response.ok) {
          const token = localStorage.getItem('token');
          if (token) {
            login(token, { ...user!, points: data.remainingPoints });
          }
          setActiveGame(gameType);
        } else {
          alert(data.message || '게임 시작 오류');
        }
      } else {
        // Free game
        setActiveGame(gameType);
      }

    } catch (error) {
      console.error('Game start error:', error);
      alert('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setLoadingGame(false);
    }
  };

  if (activeGame === 'jump') {
    return <JumpGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'shooting') {
    return <ShootingGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'fortune') {
    return <FortuneGame onBack={() => setActiveGame(null)} user={user} />;
  }

  const jumpConfig = getGameConfig('jump');
  const shootingConfig = getGameConfig('shooting');

  const faqItems = [
    { q: '게임 이용은 무료인가요?', a: '게임마다 다릅니다. 유료 게임은 포인트가 차감되며, 무료 게임은 자유롭게 즐기실 수 있습니다.' },
    { q: '점수를 저장할 수 있나요?', a: '현재는 점수 저장 기능을 제공하지 않지만, 추후 랭킹 시스템이 도입될 예정입니다.' },
    { q: '모바일에서도 플레이 가능한가요?', a: '네, 모든 게임은 모바일 환경에 최적화되어 있어 스마트폰에서도 편하게 즐기실 수 있습니다.' },
    { q: '새로운 게임은 언제 추가되나요?', a: '지속적으로 새로운 미니게임을 개발 중이며, 곧 업데이트될 예정입니다. 기대해주세요!' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          미니 게임 천국 🎮
        </h1>
        <p className="text-xl text-gray-600">
          심심할 때 즐기는 짐가방 미니게임!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
        {/* Fortune Game Card (New) */}
        <div
          onClick={() => handleStartGame('fortune')}
          className="group relative bg-purple-900 rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-4 border-transparent hover:border-purple-400"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-black opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
              🔮
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">운세 가챠</h2>
            <p className="text-purple-200 mb-4">
              10억분의 1 확률!<br />오늘의 행운을 뽑아보세요.
            </p>
            <span className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 bg-purple-600 text-white">
               무료 (Free) / 하루 10회
            </span>
            <div>
              <span className="inline-block px-6 py-2 bg-purple-500 text-white font-bold rounded-full shadow-lg group-hover:bg-purple-600 transition-colors">
                운세 뽑기
              </span>
            </div>
          </div>
        </div>

        {/* Jump Game Card */}
        <div
          onClick={() => !loadingGame && handleStartGame('jump')}
          className="group relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-4 border-transparent hover:border-yellow-400"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
              🧳
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">짐프 (JUMP)</h2>
            <p className="text-gray-500 mb-4">
              짐가방을 잃어버리지 않게<br />최대한 높이 점프하세요!
            </p>
            {jumpConfig && (
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 ${jumpConfig.isPaid ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                {jumpConfig.isPaid ? `${jumpConfig.cost} Point` : '무료 (Free)'}
              </span>
            )}
            <div>
              <span className="inline-block px-6 py-2 bg-yellow-400 text-white font-bold rounded-full shadow-lg group-hover:bg-yellow-500 transition-colors">
                플레이 하기
              </span>
            </div>
          </div>
        </div>

        {/* Shooting Game Card */}
        <div
          onClick={() => !loadingGame && handleStartGame('shooting')}
          className="group relative bg-gray-900 rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-4 border-transparent hover:border-blue-400"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
              ✈️
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">비행기 슈팅</h2>
            <p className="text-gray-400 mb-4">
              짐가방 괴물을 물리치고<br />보스를 격파하세요!
            </p>
            {shootingConfig && (
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 ${shootingConfig.isPaid ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
                }`}>
                {shootingConfig.isPaid ? `${shootingConfig.cost} Point` : '무료 (Free)'}
              </span>
            )}
            <div>
              <span className="inline-block px-6 py-2 bg-blue-500 text-white font-bold rounded-full shadow-lg group-hover:bg-blue-600 transition-colors">
                플레이 하기
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 mb-20">
        더 많은 게임이 곧 추가될 예정입니다!
      </div>

      {/* FAQ Section */}
      <section id="faq" className="w-full max-w-3xl px-4 mb-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">❓ 자주 묻는 질문</h2>
        <p className="text-center text-gray-600 mb-10">
          미니게임에 대해 궁금하신 점을 확인하세요
        </p>

        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-bold text-gray-800">Q. {item.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}
              >
                <div className="px-6 pb-4 text-gray-600 bg-gray-50 border-t border-gray-100 pt-4">
                  A. {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
