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

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">대시보드</h1>
            <DashboardStats
                storageCount={data.storageCount}
                reportCount={data.reportCount}
                userCount={data.regularUserCount + data.adminUserCount}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentActivity activities={data.recentActivities} />
                {/* 추가적인 차트나 통계가 있다면 여기에 배치 */}
            </div>
        </div>
    );
}
