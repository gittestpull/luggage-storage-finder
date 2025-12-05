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
                const response = await axios.get('/api/mgmt-secure/access-logs', {
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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">🔒 의심 접속 기록</h1>
            <p className="text-gray-600 mb-4">
                /admin 경로로 접속을 시도한 기록입니다. (해커 탐지용)
            </p>

            {logs.length === 0 ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    아직 의심스러운 접속 시도가 없습니다.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    시간
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    IP
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    행동
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    User Agent
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Referer
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-red-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {new Date(log.timestamp).toLocaleString('ko-KR')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-red-600">
                                        {log.ip}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded text-xs ${log.method === 'login_attempt'
                                                ? 'bg-red-200 text-red-800'
                                                : 'bg-yellow-200 text-yellow-800'
                                            }`}>
                                            {log.method === 'login_attempt' ? '로그인 시도' : '페이지 방문'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={log.userAgent}>
                                        {log.userAgent}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {log.referer}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
