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
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            주소
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            프리미엄 상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {storages.map((storage) => (
                        <tr key={storage._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {storage.name}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{storage.address}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${storage.isPremium
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {storage.isPremium ? 'Premium' : '일반'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    onClick={() => handleTogglePremium(storage)}
                                    className={`${storage.isPremium
                                            ? 'text-gray-600 hover:text-gray-900'
                                            : 'text-yellow-600 hover:text-yellow-900'
                                        }`}
                                >
                                    {storage.isPremium ? '해제' : '설정'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
