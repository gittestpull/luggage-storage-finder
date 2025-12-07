'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Feedback {
    _id: string;
    email?: string;
    content: string;
    createdAt: string;
}

export default function FeedbackList() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const res = await axios.get('/api/feedback');
            setFeedbacks(res.data);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            alert('피드백 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const filteredFeedbacks = feedbacks.filter(
        (item) =>
            item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-center text-slate-500">로딩 중...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800">
                    📢 접수된 의견 <span className="text-blue-500 ml-1">{feedbacks.length}</span>
                </h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="검색어 입력..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm"
                    />
                    <svg
                        className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold text-sm">
                        <tr>
                            <th className="px-6 py-4">날짜</th>
                            <th className="px-6 py-4">이메일</th>
                            <th className="px-6 py-4">내용</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFeedbacks.length > 0 ? (
                            filteredFeedbacks.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 font-medium">
                                        {item.email ? (
                                            <a href={`mailto:${item.email}`} className="text-blue-500 hover:underline">
                                                {item.email}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm max-w-md break-words whitespace-pre-wrap">
                                        {item.content}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                                    접수된 의견이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
