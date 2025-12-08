'use client';

interface DashboardStatsProps {
    storageCount: number;
    reportCount: number;
    userCount: number;
}

export default function DashboardStats({
    storageCount,
    reportCount,
    userCount,
}: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium uppercase">
                    총 짐보관소
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{storageCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium uppercase">
                    대기 중인 제보
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reportCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium uppercase">
                    총 사용자
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{userCount}</p>
            </div>
        </div>
    );
}
