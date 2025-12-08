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
            alert(`오류가 발생했습니다: ${error.message}`);
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
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <ul className="divide-y divide-gray-200">
                {places.map((place) => (
                    <li key={place._id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div className="flex-grow mb-3 sm:mb-0">
                            <p className="font-bold text-lg text-gray-800">{place.name}</p>
                            <p className="text-sm text-gray-600">{place.address}</p>
                            {place.description && <p className="text-sm text-gray-500 mt-1 italic">"{place.description}"</p>}
                        </div>
                        <div className="flex-shrink-0 flex space-x-2">
                            <button
                                onClick={() => handleApproval(place._id, 'approved')}
                                disabled={loadingId === place._id}
                                className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400"
                            >
                                {loadingId === place._id ? '처리중...' : '승인'}
                            </button>
                            <button
                                onClick={() => handleApproval(place._id, 'rejected')}
                                disabled={loadingId === place._id}
                                className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                            >
                                {loadingId === place._id ? '처리중...' : '거절'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
