'use client';

import { useState } from 'react';
import JumpGame from './JumpGame';
import ShootingGame from './ShootingGame';

export default function FunPage() {
  const [activeGame, setActiveGame] = useState<'jump' | 'shooting' | null>(null);

  if (activeGame === 'jump') {
    return <JumpGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'shooting') {
    return <ShootingGame onBack={() => setActiveGame(null)} />;
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {/* Jump Game Card */}
        <div
          onClick={() => setActiveGame('jump')}
          className="group relative bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-4 border-transparent hover:border-yellow-400"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
              🧳
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">짐프 (JUMP)</h2>
            <p className="text-gray-500 mb-6">
              짐가방을 잃어버리지 않게<br/>최대한 높이 점프하세요!
            </p>
            <span className="inline-block px-6 py-2 bg-yellow-400 text-white font-bold rounded-full shadow-lg group-hover:bg-yellow-500 transition-colors">
              플레이 하기
            </span>
          </div>
        </div>

        {/* Shooting Game Card */}
        <div
          onClick={() => setActiveGame('shooting')}
          className="group relative bg-gray-900 rounded-3xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-4 border-transparent hover:border-blue-400"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
              ✈️
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">비행기 슈팅</h2>
            <p className="text-gray-400 mb-6">
              짐가방 괴물을 물리치고<br/>보스를 격파하세요!
            </p>
            <span className="inline-block px-6 py-2 bg-blue-500 text-white font-bold rounded-full shadow-lg group-hover:bg-blue-600 transition-colors">
              플레이 하기
            </span>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400">
        더 많은 게임이 곧 추가될 예정입니다!
      </div>
    </div>
  );
}
