'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Place {
    _id: string;
    name: string;
    address: string;
    description?: string;
    status: string;
    createdAt: string;
}

export default function PlacesManagementPage() {
    const router = useRouter();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/mgmt-secure/login');
            return;
        }
        fetchPlaces();
    }, [router]);

    const fetchPlaces = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/places/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPlaces(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch places:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/places/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setPlaces(places.filter(p => p._id !== id));
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('정말로 이 장소를 거절하시겠습니까?')) return;
        setActionLoading(id);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/places/${id}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setPlaces(places.filter(p => p._id !== id));
            }
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-100">맛집/카페 관리</h1>
                <p className="text-slate-400 mt-1">사용자가 제보한 맛집/카페를 승인하거나 거절할 수 있습니다.</p>
            </div>

            {places.length === 0 ? (
                <div className="bg-slate-800/50 rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-slate-300">대기 중인 장소가 없습니다</h3>
                    <p className="text-slate-500 mt-2">새로운 장소 제보가 들어오면 여기에 표시됩니다.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {places.map(place => (
                        <div key={place._id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-100">{place.name}</h3>
                                    <p className="text-slate-400 text-sm mt-1">📍 {place.address}</p>
                                    {place.description && (
                                        <p className="text-slate-500 text-sm mt-2">{place.description}</p>
                                    )}
                                    <p className="text-slate-600 text-xs mt-3">
                                        제보일: {new Date(place.createdAt).toLocaleDateString('ko-KR')}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleApprove(place._id)}
                                        disabled={actionLoading === place._id}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === place._id ? '처리중...' : '✓ 승인'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(place._id)}
                                        disabled={actionLoading === place._id}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        ✕ 거절
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 text-slate-500 text-sm">
                총 {places.length}개의 대기 중인 장소
            </div>
        </div>
    );
}
