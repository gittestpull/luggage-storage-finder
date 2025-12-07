'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardStats from '@/components/admin/DashboardStats';
import RecentActivity from '@/components/admin/RecentActivity';

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get('/api/admin/dashboard', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setData(response.data);
            } catch (err: any) {
                setError('데이터를 불러오는 중 오류가 발생했습니다.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!data) return null;

    // Prepare stats object for DashboardStats component
    const stats = {
        totalStorages: data.storageCount,
        totalUsers: data.regularUserCount + data.adminUserCount,
        pendingReports: data.reportCount,
        totalRevenue: 0,
    };

    const recentActivities = data.recentActivities.map((item: any) => {
        let description = '';
        if (item.type === 'user') {
            description = `${item.username}님이 가입했습니다.`;
        } else if (item.type === 'report') {
            description = `${item.name || '새로운 장소'} 제보가 들어왔습니다.`;
        } else {
            description = '새로운 활동이 있습니다.';
        }

        return {
            _id: item._id,
            description,
            createdAt: item.createdAt,
        };
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">대시보드</h1>
                <p className="text-slate-500 mt-2">시스템 현황을 한눈에 확인하세요.</p>
            </div>

            <DashboardStats stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentActivity activities={recentActivities} />
                {/* 추후 차트나 추가 위젯이 들어갈 자리 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-center min-h-[300px]">
                    <div className="text-center text-slate-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                        <p className="text-lg font-medium">통계 차트 (준비 중)</p>
                        <p className="text-sm mt-1">방문자 수 추이 등이 표시될 예정입니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
