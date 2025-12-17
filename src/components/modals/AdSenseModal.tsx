'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

interface AdSenseModalProps {
  onClose: () => void;
  clientId?: string;
  slotId?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdSenseModal({ onClose, clientId = 'ca-pub-2858917314962782', slotId = '1234567890' }: AdSenseModalProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsAdLoaded(true);
      }
    } catch (err) {
      console.error('AdSense push error:', err);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center">
        {/* Header */}
        <div className="w-full bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">잠깐! 광고 보고 가실게요 💼</h3>
        </div>

        {/* Ad Container */}
        <div className="w-full p-6 flex flex-col items-center justify-center min-h-[300px] bg-gray-100">
            <div className="text-sm text-gray-500 mb-2">광고</div>
            {/* Google AdSense Unit */}
            <ins className="adsbygoogle"
                 style={{ display: 'block', width: '100%', minHeight: '250px' }}
                 data-ad-client={clientId}
                 data-ad-slot={slotId}
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>

            {/* Fallback visual if ad blocker or localhost */}
            <div className="hidden peer-empty:flex flex-col items-center text-center text-gray-400 mt-4">
                <span>(광고가 로드되지 않았습니다)</span>
            </div>
        </div>

        {/* Footer */}
        <div className="w-full px-6 py-4 bg-white border-t border-gray-100 flex flex-col gap-2">
            <p className="text-center text-sm text-gray-500 mb-2">
                게임 시작을 위해 아래 버튼을 눌러주세요
            </p>
            <Button
                onClick={onClose}
                className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
            >
                광고 닫고 게임 시작 🎮
            </Button>
        </div>
      </div>
    </div>
  );
}
