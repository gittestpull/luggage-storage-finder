'use client';

interface DashboardStatsProps {
    stats: {
        totalStorages: number;
        totalUsers: number;
        pendingReports: number;
        totalRevenue: number;
    };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
    const statItems = [
        {
            label: '총 짐보관소',
            value: stats.totalStorages,
            icon: (
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: 'bg-blue-50 text-blue-600',
            trend: '+12% 이번 달',
        },
        {
            label: '총 사용자',
            value: stats.totalUsers,
            icon: (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: 'bg-green-50 text-green-600',
            trend: '+5% 지난 주',
        },
        {
            label: '대기 중인 제보',
            value: stats.pendingReports,
            icon: (
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            color: 'bg-yellow-50 text-yellow-600',
            desc: '처리 필요',
        },
        {
            label: '예상 수익 (월)',
            value: `₩${stats.totalRevenue?.toLocaleString() || '0'}`,
            icon: (
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'bg-purple-50 text-purple-600',
            trend: '+8% 전월 대비',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statItems.map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${item.color}`}>
                            {item.icon}
                        </div>
                        {item.desc && (
                            <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                {item.desc}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{item.label}</p>
                        <h3 className="text-2xl font-bold text-slate-800">{item.value}</h3>
                        {item.trend && (
                            <p className="text-xs font-medium text-green-600 mt-2 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                {item.trend}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
