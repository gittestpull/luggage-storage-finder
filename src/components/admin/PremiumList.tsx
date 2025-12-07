'use client';

import axios from 'axios';

interface Storage {
    _id: string;
    name: string;
    address: string;
    isPremium: boolean;
}

interface PremiumListProps {
    storages: Storage[];
    onRefresh: () => void;
}

export default function PremiumList({ storages, onRefresh }: PremiumListProps) {
    const handleTogglePremium = async (storage: Storage) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `/api/admin/storages/${storage._id}/premium`,
                { isPremium: !storage.isPremium },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onRefresh();
        } catch (error) {
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">프리미엄 관리</h2>
                    <p className="text-sm text-slate-500 mt-1">짐보관소의 프리미엄 상태를 관리하여 상단 노출을 제어합니다.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">짐보관소</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">현재 상태</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {storages.map((storage) => (
                                <tr key={storage._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{storage.name}</span>
                                            <span className="text-sm text-gray-500 mt-0.5">{storage.address}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${storage.isPremium
                                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                : 'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}
                                        >
                                            {storage.isPremium ? '💎 Premium' : '일반'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleTogglePremium(storage)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${storage.isPremium
                                                ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-yellow-200'
                                                }`}
                                        >
                                            {storage.isPremium ? '해제하기' : '프리미엄 설정'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
