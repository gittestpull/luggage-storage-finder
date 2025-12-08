'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Subscription {
    _id: string;
    endpoint: string;
    createdAt: string;
    memo?: string;
}

export default function SubscriberManagement() {
    const [subscribers, setSubscribers] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
    const [pushData, setPushData] = useState({ title: '', body: '', url: '' });
    const [sending, setSending] = useState(false);
    const [memo, setMemo] = useState<{ [key: string]: string }>({});
    const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
    const [saved, setSaved] = useState<{ [key: string]: boolean }>({});

    const fetchSubscribers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/admin/subscribers', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubscribers(response.data);
            // Initialize memo state
            const initialMemos: { [key: string]: string } = {};
            response.data.forEach((sub: Subscription) => {
                initialMemos[sub._id] = sub.memo || '';
            });
            setMemo(initialMemos);
        } catch (error) {
            console.error('Failed to fetch subscribers', error);
            alert('목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const handleMemoChange = (id: string, value: string) => {
        setMemo(prev => ({ ...prev, [id]: value }));
        setSaving(prev => ({ ...prev, [id]: true }));
        setSaved(prev => ({ ...prev, [id]: false }));
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            Object.keys(saving).forEach(id => {
                if (saving[id]) {
                    const token = localStorage.getItem('adminToken');
                    axios.post('/api/admin/subscribers', { id, memo: memo[id] }, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then(() => {
                        setSaving(prev => ({ ...prev, [id]: false }));
                        setSaved(prev => ({ ...prev, [id]: true }));
                        setTimeout(() => {
                            setSaved(prev => ({ ...prev, [id]: false }));
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to save memo', err);
                        setSaving(prev => ({ ...prev, [id]: false }));
                    });
                }
            });
        }, 1000); // Debounce time

        return () => {
            clearTimeout(handler);
        };
    }, [memo, saving]);

    const openSendModal = (sub: Subscription) => {
        setSelectedSub(sub);
        setPushData({ title: '', body: '', url: '' });
        setIsModalOpen(true);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub) return;
        setSending(true);

        try {
            const token = localStorage.getItem('adminToken');
            await axios.post('/api/admin/push/send-individual', {
                subscriptionId: selectedSub._id,
                ...pushData
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('알림을 성공적으로 보냈습니다.');
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Send error:', error);
            alert('알림 전송 실패: ' + (error.response?.data?.message || '오류가 발생했습니다.'));
            if (error.response?.status === 410) {
                // If gone, refresh list
                fetchSubscribers();
            }
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8">로딩 중...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">구독자 관리</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">총 구독자: {subscribers.length}명</span>
                    <button onClick={fetchSubscribers} className="text-blue-600 hover:text-blue-800 text-sm">↻ 새로고침</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Endpoint</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subscribers.map((sub) => (
                                <tr key={sub._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate cursor-help" title={sub.endpoint}>
                                        <div className="font-mono text-xs">{sub._id}</div>
                                        <div className="text-xs text-gray-400 truncate w-48">{sub.endpoint}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <input
                                            type="text"
                                            value={memo[sub._id] || ''}
                                            onChange={(e) => handleMemoChange(sub._id, e.target.value)}
                                            placeholder="메모 입력"
                                            className="w-full border rounded px-2 py-1 text-sm"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            {saving[sub._id] ? '저장 중...' : saved[sub._id] ? '저장됨' : ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => openSendModal(sub)}
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors text-xs"
                                        >
                                            🔔 알림 발송
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {subscribers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        구독자가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Send Push Modal */}
            {isModalOpen && selectedSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                        <h2 className="text-xl font-bold mb-4">개별 알림 보내기</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            구독자 ID: <span className="font-mono">{selectedSub._id}</span>
                        </p>

                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={pushData.title}
                                    onChange={(e) => setPushData({ ...pushData, title: e.target.value })}
                                    placeholder="예: 보관소 예약 확인"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                                <textarea
                                    required
                                    className="w-full border rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                    value={pushData.body}
                                    onChange={(e) => setPushData({ ...pushData, body: e.target.value })}
                                    placeholder="알림 내용을 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL (선택)</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={pushData.url}
                                    onChange={(e) => setPushData({ ...pushData, url: e.target.value })}
                                    placeholder="/"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                                >
                                    {sending ? '전송 중...' : '전송하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
