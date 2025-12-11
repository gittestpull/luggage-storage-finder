// src/components/admin/PendingPlacesList.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';

// Define the type for a Place object, assuming its structure
interface Place {
    _id: string;
    name: string;
    address: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface Props {
    places: Place[];
    onRefresh: () => void;
}

export default function PendingPlacesList({ places, onRefresh }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleApproval = async (id: string, newStatus: 'approved' | 'rejected') => {
        setLoadingId(id);
        try {
            const token = localStorage.getItem('adminToken');
            const url = newStatus === 'approved'
                ? `/api/admin/places/${id}/approve`
                : `/api/admin/places/${id}/reject`;

            await axios.put(url, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onRefresh(); // Refresh the list after action
        } catch (error) {
            console.error(`Failed to ${newStatus} place`, error);
            // alert(`오류가 발생했습니다: ${error.message}`);
            alert('오류가 발생했습니다.');
        } finally {
            setLoadingId(null);
        }
    };

    if (places.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-gray-500">현재 대기 중인 제보가 없습니다.</p>
            </div>
        )
    }

    return (
        <div>
            {/* Desktop View (Table) */}
            <div className="hidden md:block overflow-x-auto">
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
                                설명
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                관리
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {places.map((place) => (
                            <tr key={place._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {place.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{place.address}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500 line-clamp-2">{place.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleApproval(place._id, 'approved')}
                                            disabled={loadingId === place._id}
                                            className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                                        >
                                            {loadingId === place._id ? '처리중...' : '승인'}
                                        </button>
                                        <button
                                            onClick={() => handleApproval(place._id, 'rejected')}
                                            disabled={loadingId === place._id}
                                            className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                                        >
                                            {loadingId === place._id ? '처리중...' : '거절'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {places.map((place) => (
                    <div key={place._id} className="bg-white p-4 rounded-lg shadow space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">{place.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{place.address}</p>
                            </div>
                        </div>
                        {place.description && (
                            <p className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                                "{place.description}"
                            </p>
                        )}
                        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => handleApproval(place._id, 'approved')}
                                disabled={loadingId === place._id}
                                className="text-green-600 font-medium text-sm hover:text-green-900 disabled:text-gray-400"
                            >
                                {loadingId === place._id ? '처리중...' : '승인'}
                            </button>
                            <button
                                onClick={() => handleApproval(place._id, 'rejected')}
                                disabled={loadingId === place._id}
                                className="text-red-600 font-medium text-sm hover:text-red-900 disabled:text-gray-400"
                            >
                                {loadingId === place._id ? '처리중...' : '거절'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
