'use client';

import { useState } from 'react';
import axios from 'axios';

const NEWS_SOURCES = [
    { id: 'main', name: '주요 뉴스' },
    { id: 'economy', name: '경제 뉴스' },
    { id: 'it', name: 'IT 뉴스' },
];

interface UpdateStatus {
    loading: boolean;
    success: boolean | null;
    message: string;
}

export default function NewsUpdateManager() {
    const [status, setStatus] = useState<{ [key: string]: UpdateStatus }>({});

    const handleUpdate = async (sourceId: string) => {
        setStatus(prev => ({
            ...prev,
            [sourceId]: { loading: true, success: null, message: '업데이트 중...' }
        }));

        try {
            const token = localStorage.getItem('adminToken');
            // 현재 모든 소스는 동일한 API 엔드포인트를 호출합니다.
            await axios.post('/api/news/update', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setStatus(prev => ({
                ...prev,
                [sourceId]: { loading: false, success: true, message: '성공적으로 업데이트되었습니다.' }
            }));
        } catch (error) {
            console.error('Failed to update news', error);
            setStatus(prev => ({
                ...prev,
                [sourceId]: { loading: false, success: false, message: '업데이트에 실패했습니다.' }
            }));
        } finally {
            // 몇 초 후에 메시지를 초기화합니다.
            setTimeout(() => {
                setStatus(prev => ({
                    ...prev,
                    [sourceId]: { ...prev[sourceId], message: '' }
                }));
            }, 3000);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold">뉴스 업데이트 관리</h2>
            </div>
            <ul className="divide-y divide-gray-200">
                {NEWS_SOURCES.map((source) => (
                    <li key={source.id} className="px-6 py-4 flex items-center justify-between">
                        <span className="font-semibold">{source.name}</span>
                        <div className="flex items-center gap-4">
                            {status[source.id]?.message && (
                                <span className={`text-sm ${status[source.id]?.success ? 'text-green-600' : 'text-red-600'}`}>
                                    {status[source.id]?.message}
                                </span>
                            )}
                            <button
                                onClick={() => handleUpdate(source.id)}
                                disabled={status[source.id]?.loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {status[source.id]?.loading ? '처리 중...' : '업데이트'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
