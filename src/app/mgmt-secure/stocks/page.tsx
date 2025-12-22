'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui';

interface RecommendedStock {
    _id: string;
    name: string;
    code: string;
    description: string;
    imageUrl?: string;
    additionalInfo?: {
        creditTrend?: string;
        shortSellTrend?: string;
    };
    createdAt: string;
}

export default function RecommendedStocksManager() {
    const [stocks, setStocks] = useState<RecommendedStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [creditTrend, setCreditTrend] = useState('');
    const [shortSellTrend, setShortSellTrend] = useState('');

    const fetchStocks = async () => {
        try {
            const res = await axios.get('/api/stocks');
            setStocks(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch stocks', err);
            setError('주식 목록을 불러오는데 실패했습니다.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post('/api/admin/stocks', {
                name,
                code,
                description,
                imageUrl,
                additionalInfo: {
                    creditTrend,
                    shortSellTrend
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset form
            setName('');
            setCode('');
            setDescription('');
            setImageUrl('');
            setCreditTrend('');
            setShortSellTrend('');

            // Refresh list
            fetchStocks();
            alert('추천 주식이 등록되었습니다.');
        } catch (err) {
            console.error('Failed to add stock', err);
            alert('주식 등록에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`정말로 '${name}' 주식을 삭제하시겠습니까?`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/admin/stocks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStocks();
        } catch (err) {
            console.error('Failed to delete stock', err);
            alert('삭제에 실패했습니다.');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">추천 주식 관리</h1>

            {/* Add New Stock Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">새 추천 주식 등록</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">종목명</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">종목코드</label>
                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">추천 사유 / 분석</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">이미지 URL (선택)</label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">신용 추이 (선택)</label>
                            <input
                                type="text"
                                value={creditTrend}
                                onChange={(e) => setCreditTrend(e.target.value)}
                                placeholder="예: 지속적 감소 추세"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">공매도 추이 (선택)</label>
                            <input
                                type="text"
                                value={shortSellTrend}
                                onChange={(e) => setShortSellTrend(e.target.value)}
                                placeholder="예: 최근 급증했으나 안정세"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            등록하기
                        </button>
                    </div>
                </form>
            </div>

            {/* List of Stocks */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">등록된 추천 주식 목록</h2>
                {stocks.length === 0 ? (
                    <p className="text-gray-500">등록된 주식이 없습니다.</p>
                ) : (
                    <div className="space-y-4">
                        {stocks.map((stock) => (
                            <div key={stock._id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{stock.name}</h3>
                                        <span className="text-sm text-gray-500">({stock.code})</span>
                                    </div>
                                    <p className="text-gray-600 mt-1 line-clamp-2">{stock.description}</p>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                        {stock.additionalInfo?.creditTrend && (
                                            <span>신용: {stock.additionalInfo.creditTrend}</span>
                                        )}
                                        {stock.additionalInfo?.shortSellTrend && (
                                            <span>공매도: {stock.additionalInfo.shortSellTrend}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(stock._id, stock.name)}
                                    className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors whitespace-nowrap"
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
