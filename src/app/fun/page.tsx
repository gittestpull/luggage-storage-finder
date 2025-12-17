'use client';

import { useState, useEffect } from 'react';
import JumpGame from './JumpGame';
import ShootingGame from './ShootingGame';
import FarmingGame from './FarmingGame';
import FortuneGame from './FortuneGame';
import NightmareGame from '../game/NightmareGame';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

interface GameConfig {
  gameId: string;
  name: string;
  description: string;
  isPaid: boolean;
  cost: number;
}

// Registry to map gameIds to specific UI themes/components
const GAME_REGISTRY: Record<string, {
  component?: React.ComponentType<{ onBack: () => void }>;
  icon: string;
  themeColor: string;
  gradientFrom: string;
  textColor: string;
  borderColor: string;
  buttonColor: string;
}> = {
  fortune: {
    component: FortuneGame,
    icon: '🔮',
    themeColor: 'bg-purple-900',
    gradientFrom: 'from-purple-800',
    textColor: 'text-purple-200',
    borderColor: 'hover:border-purple-400',
    buttonColor: 'bg-purple-500 hover:bg-purple-600'
  },
  jump: {
    component: JumpGame,
    icon: '🧳',
    themeColor: 'bg-white',
    gradientFrom: 'from-blue-50',
    textColor: 'text-gray-500',
    borderColor: 'hover:border-yellow-400',
    buttonColor: 'bg-yellow-400 hover:bg-yellow-500' // Note: Original had yellow button on white bg
  },
  shooting: {
    component: ShootingGame,
    icon: '✈️',
    themeColor: 'bg-gray-900',
    gradientFrom: 'from-gray-800',
    textColor: 'text-gray-400',
    borderColor: 'hover:border-blue-400',
    buttonColor: 'bg-blue-500 hover:bg-blue-600'
  },
  nightmare: {
    component: NightmareGame,
    icon: '🧟',
    themeColor: 'bg-black',
    gradientFrom: 'from-red-900',
    textColor: 'text-red-200',
    borderColor: 'hover:border-red-600',
    buttonColor: 'bg-red-700 hover:bg-red-600'
  },
  farming: {
    component: FarmingGame,
    icon: '🧑‍🌾',
    themeColor: 'bg-green-50',
    gradientFrom: 'from-green-100',
    textColor: 'text-green-700',
    borderColor: 'hover:border-green-400',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  }
};

export default function FunPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
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

  // Scroll to top when game starts
  useEffect(() => {
    if (activeGame) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeGame]);

  const handleStartGame = async (gameId: string) => {
    // Fortune Game has its own logic for cost/limits inside the component usually,
    // but here we check typical payment flow if configured as paid in DB.
    // However, FortuneGame component handles its own internal mechanics.
    // For consistency, if it's "Fortune", we might just let it open and handle logic internally if it's special.
    // The original code bypassed payment logic for fortune. Let's keep that safely or rely on DB isPaid.

    // Check if registry has it
    const registry = GAME_REGISTRY[gameId];
    if (!registry) return; // Unknown game component

    const config = gameConfigs.find(g => g.gameId === gameId);
    if (!config) return;

    // Special logic for Fortune game if it handles its own cost/ads
    if (gameId === 'fortune') {
      setActiveGame(gameId);
      return;
    }

    const { isPaid, cost } = config;

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

      // Check if user confirms payment (Corrected logic: if !confirm return)
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
          body: JSON.stringify({ gameId })
        });
        const data = await response.json();

        if (response.ok) {
          const token = localStorage.getItem('token');
          if (token) {
            login(token, { ...user!, points: data.remainingPoints });
          }
          setActiveGame(gameId);
        } else {
          alert(data.message || '게임 시작 오류');
        }
      } else {
        // Free game
        setActiveGame(gameId);
      }

    } catch (error) {
      console.error('Game start error:', error);
      alert('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setLoadingGame(false);
    }
  };

  // Render Active Game
  if (activeGame) {
    const Component = GAME_REGISTRY[activeGame]?.component;
    if (Component) {
      return <Component onBack={() => setActiveGame(null)} />;
    }
  }

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
        {gameConfigs.map((config) => {
          const registry = GAME_REGISTRY[config.gameId];
          const isKnownGame = !!registry;

          // Default fallback style for unknown games
          const style = registry || {
            icon: '🚧',
            themeColor: 'bg-gray-200',
            gradientFrom: 'from-gray-100',
            textColor: 'text-gray-500',
            borderColor: 'hover:border-gray-400',
            buttonColor: 'bg-gray-400 cursor-not-allowed'
          };

          // Override text colors specifically for Jump Game (White bg needs dark text)
          const isWhiteTheme = config.gameId === 'jump';
          const titleColor = isWhiteTheme ? 'text-gray-800' : 'text-white';

          return (
            <div
              key={config.gameId}
              onClick={() => isKnownGame && !loadingGame && handleStartGame(config.gameId)}
              className={`group relative ${style.themeColor} rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-4 border-transparent ${style.borderColor}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${style.gradientFrom} to-black opacity-10 group-hover:opacity-20 transition-opacity`} />

              {/* White theme needs special overlay handling or it looks too dark with 'to-black' */}
              {isWhiteTheme && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
              {!isWhiteTheme && (
                <div className={`absolute inset-0 bg-gradient-to-br ${style.gradientFrom} to-black opacity-50 group-hover:opacity-100 transition-opacity`} />
              )}

              <div className="p-8 flex flex-col items-center text-center relative z-10">
                <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {style.icon}
                </div>
                <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>{config.name}</h2>
                <p className={`${style.textColor} mb-4`}>
                  {config.description.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                </p>

                <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 ${config.isPaid ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                  {config.isPaid ? `${config.cost} Point` : '무료 (Free)'}
                </span>

                <div>
                  <span
                    onClick={() => {
                      if (!isKnownGame) {
                        alert(`Debug Info:\nGameID DB: '${config.gameId}'\nRegistry Keys: ${Object.keys(GAME_REGISTRY).join(', ')}\nMatch: ${Object.keys(GAME_REGISTRY).includes(config.gameId)}`);
                      }
                    }}
                    className={`inline-block px-6 py-2 text-white font-bold rounded-full shadow-lg transition-colors ${style.buttonColor} ${!isKnownGame ? 'cursor-help' : ''}`}>
                    {isKnownGame ? '플레이 하기' : '준비 중 (클릭하여 확인)'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
