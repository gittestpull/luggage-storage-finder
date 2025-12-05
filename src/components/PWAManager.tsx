'use client';

import { useEffect, useState } from 'react';

export default function PWAManager() {
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // 서비스 워커 등록
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);

                    // 전역 함수 정의: 알림 구독 요청
                    (window as any).requestPushPermission = async () => {
                        // iOS 감지
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
                        // PWA 모드인지 확인 (standalone)
                        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

                        if (isIOS && !isStandalone) {
                            setShowIOSGuide(true);
                            return;
                        }

                        if (!('Notification' in window)) {
                            alert('이 브라우저는 알림을 지원하지 않습니다.');
                            return;
                        }

                        try {
                            const permission = await Notification.requestPermission();
                            if (permission === 'granted') {
                                console.log('알림 권한 허용됨');

                                const subscription = await registration.pushManager.subscribe({
                                    userVisibleOnly: true,
                                    applicationServerKey: urlBase64ToUint8Array('BE5xeCmV_Tkys3Vjv5b8sNuiNxs3HQuOLuDxm1TKz37QRLVBPPtjLhttBbiSOfgqWLeUnB5y56cZFtzerkodgRQ')
                                });

                                console.log('푸시 구독 성공:', subscription);

                                // 백엔드에 구독 정보 전송
                                const response = await fetch('/api/subscribe', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(subscription),
                                });

                                if (response.ok) {
                                    alert('알림 구독이 완료되었습니다! 🎉\n이제 새로운 프리미엄 보관소 소식을 받아보실 수 있습니다.');
                                } else {
                                    throw new Error('서버 전송 실패');
                                }
                            } else {
                                alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
                            }
                        } catch (error) {
                            console.error('푸시 구독 오류:', error);
                            alert('알림 구독 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n(iOS의 경우 홈 화면에 추가된 앱에서만 동작합니다)');
                        }
                    };
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    if (!showIOSGuide) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-900">아이폰 알림 설정 안내 🍎</h3>
                <p className="text-sm text-gray-600 mb-4">
                    아이폰에서는 <strong>홈 화면에 추가</strong>해야 알림을 받을 수 있습니다.
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2 mb-6">
                    <li>하단의 <strong>공유 버튼</strong> <span className="inline-block align-middle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg></span> 을 누르세요.</li>
                    <li>메뉴에서 <strong>'홈 화면에 추가'</strong>를 선택하세요.</li>
                    <li>홈 화면에 생긴 앱 아이콘으로 다시 접속해주세요.</li>
                </ol>
                <button
                    onClick={() => setShowIOSGuide(false)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    확인했습니다
                </button>
            </div>
        </div>
    );
}

// VAPID 키 변환 유틸리티
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
