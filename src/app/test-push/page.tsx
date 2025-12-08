'use client';

import { useState, useEffect } from 'react';

export default function TestPushPage() {
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    setSubscription(sub);
                    if (sub) {
                        addLog('현재 구독 정보 발견됨');
                    } else {
                        addLog('현재 구독 정보 없음');
                    }
                });
            });
        } else {
            addLog('서비스 워커 미지원 브라우저');
        }
    }, []);

    const handleSubscribe = async () => {
        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.ready;

            // 기존 구독 해지 (확실한 갱신을 위해)
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
                await existingSub.unsubscribe();
                addLog('기존 구독 해지 완료');
            }

            const newSub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BE5xeCmV_Tkys3Vjv5b8sNuiNxs3HQuOLuDxm1TKz37QRLVBPPtjLhttBbiSOfgqWLeUnB5y56cZFtzerkodgRQ')
            });

            setSubscription(newSub);
            addLog('새 구독 생성 성공');

            // 백엔드 저장
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSub)
            });
            addLog('백엔드에 구독 정보 저장 완료');

        } catch (error: any) {
            addLog(`구독 실패: ${error.message}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestSend = async () => {
        if (!subscription) {
            alert('먼저 구독을 해주세요.');
            return;
        }

        try {
            setLoading(true);
            addLog('테스트 발송 요청 중...');

            const res = await fetch('/api/push/send-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription })
            });

            const result = await res.json();
            if (res.ok) {
                addLog(`발송 성공: ${JSON.stringify(result)}`);
                alert('발송 성공! 알림이 왔는지 확인해보세요.');
            } else {
                addLog(`발송 실패: ${JSON.stringify(result)}`);
                alert('발송 실패. 로그를 확인하세요.');
            }
        } catch (error: any) {
            addLog(`발송 요청 에러: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">🔔 푸시 알림 테스트</h1>

            <div className="space-y-4 mb-8">
                <div className="p-4 bg-gray-100 rounded">
                    <h3 className="font-semibold mb-2">현재 구독 상태</h3>
                    <pre className="text-xs overflow-auto bg-white p-2 rounded border h-32">
                        {subscription ? JSON.stringify(subscription, null, 2) : '구독 정보 없음'}
                    </pre>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '처리 중...' : '1. 강제 재구독'}
                    </button>

                    <button
                        onClick={handleTestSend}
                        disabled={loading || !subscription}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? '전송 중...' : '2. 나에게 테스트 발송'}
                    </button>
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">로그</h3>
                <div className="bg-black text-green-400 p-4 rounded h-64 overflow-auto font-mono text-sm">
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

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
