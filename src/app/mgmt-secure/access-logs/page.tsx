'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface AccessLog {
    _id: string;
    path: string;
    ip: string;
    userAgent: string;
    referer: string;
    method: string;
    timestamp: string;
}

export default function AccessLogsPage() {
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get('/api/admin/access-logs', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLogs(response.data);
            } catch (error) {
                console.error('Failed to fetch access logs', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3 mb-2">
                    <span className="p-2 bg-red-100 rounded-lg text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </span>
                    <h1 className="text-xl font-bold text-slate-800">의심 접속 기록 (Honeypot)</h1>
                </div>
                <p className="text-slate-500 text-sm ml-12">
                    관리자 페이지(/admin)로의 비정상적인 접근 시도를 기록합니다.
                </p>
            </div>

            {logs.length === 0 ? (
                <div className="bg-green-50 border border-green-100 text-green-700 px-6 py-12 rounded-2xl text-center flex flex-col items-center">
                    <svg className="w-12 h-12 mb-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-lg">안전합니다!</p>
                    <p className="text-sm mt-1 text-green-600">아직 의심스러운 접속 시도가 감지되지 않았습니다.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">시간</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">IP 주소</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">유형</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">정보 (User Agent)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-red-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(log.timestamp).toLocaleString('ko-KR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-800">
                                            {log.ip}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${log.method === 'login_attempt'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                {log.method === 'login_attempt' ? '⚠️ 로그인 시도' : '👀 페이지 접속'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={log.userAgent}>
                                            <div className="flex flex-col">
                                                <span>{log.userAgent}</span>
                                                {log.referer && (
                                                    <span className="text-xs text-slate-400 mt-0.5">Ref: {log.referer}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
