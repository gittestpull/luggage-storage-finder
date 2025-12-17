'use client';

import { useState } from 'react';

export default function MarketingPage() {
  const [message, setMessage] = useState('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    alert('홍보 메시지가 클립보드에 복사되었습니다!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">홍보 자동화 (Marketing RPA)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: 메시지 설정 */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mr-3 text-sm">1</span>
            홍보 메시지 작성
          </h2>
          <div className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="여기에 홍보할 문구와 링크를 입력하세요..."
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={copyToClipboard}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              메시지 복사하기
            </button>
          </div>
        </div>

        {/* Step 2: 봇 다운로드 및 실행 */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mr-3 text-sm">2</span>
            RPA 봇 실행 (v2.0)
          </h2>

          <div className="space-y-6 text-slate-300">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <h3 className="font-medium text-white mb-2">설치 및 실행 방법</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>PC에 Python이 설치되어 있어야 합니다.</li>
                <li>봇을 다운로드하고, 터미널에서 아래 라이브러리를 설치하세요:
                  <div className="mt-1 p-2 bg-black rounded text-green-400 font-mono text-xs select-all cursor-pointer">
                    pip install requests beautifulsoup4 pyautogui pyperclip pillow
                  </div>
                </li>
                <li>봇을 실행합니다:
                  <div className="mt-1 p-2 bg-black rounded text-green-400 font-mono text-xs select-all cursor-pointer">
                    python marketing_bot.py
                  </div>
                </li>
                <li className="text-yellow-400">
                  <strong>중요:</strong> 처음 실행 시 <span className="underline">초기 설정(캘리브레이션)</span>을 진행하여 버튼 위치를 봇에게 알려주세요.
                </li>
              </ol>
            </div>

            <a
              href="/marketing_bot.py"
              download="marketing_bot.py"
              className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg font-medium transition-colors"
            >
              RPA 봇 다운로드 (.py)
            </a>

            <div className="text-xs text-slate-500 space-y-1">
              <p>* 이 봇은 Google 검색을 통해 방 링크를 수집하고, 카카오톡 PC 버전을 제어하여 자동으로 입장 및 전송을 시도합니다.</p>
              <p>* '초기 설정'이 정확해야 자동 입장이 성공합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
