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
    // 수정 시 필요한 필드들
}

// 수정 모달을 위한 Type
interface EditFormData {
    name: string;
    address: string;
    description: string;
}

export default function PlacesManagementPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

    const [places, setPlaces] = useState<Place[]>([]); // 대기 중인 장소
    const [approvedPlaces, setApprovedPlaces] = useState<Place[]>([]); // 승인된 장소

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // 수정 모달 상태
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({ name: '', address: '', description: '' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/mgmt-secure/login');
            return;
        }
        fetchPlaces();
        fetchApprovedPlaces();
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
            console.error('Failed to fetch pending places:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovedPlaces = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/places/approved', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setApprovedPlaces(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch approved places:', error);
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
                fetchApprovedPlaces(); // 승인 목록 갱신
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

    const handleDelete = async (id: string, isApprovedList = false) => {
        if (!confirm('정말로 이 장소를 삭제하시겠습니까? 복구할 수 없습니다.')) return;
        setActionLoading(id);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/places/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                if (isApprovedList) {
                    setApprovedPlaces(approvedPlaces.filter(p => p._id !== id));
                } else {
                    setPlaces(places.filter(p => p._id !== id));
                }
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // 수정 모달 열기
    const openEditModal = (place: Place) => {
        setEditingPlace(place);
        setEditForm({
            name: place.name,
            address: place.address,
            description: place.description || '',
        });
        setIsEditModalOpen(true);
    };

    // 수정 저장
    const handleUpdate = async () => {
        if (!editingPlace) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/places/${editingPlace._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                const data = await res.json();
                // 목록 갱신
                setApprovedPlaces(approvedPlaces.map(p => p._id === editingPlace._id ? { ...p, ...data.data } : p));
                setIsEditModalOpen(false);
                setEditingPlace(null);
                alert('수정되었습니다.');
            } else {
                alert('수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to update:', error);
            alert('오류가 발생했습니다.');
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
                <p className="text-slate-400 mt-1">사용자가 제보한 맛집/카페를 관리합니다.</p>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex space-x-4 mb-6 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'pending'
                            ? 'text-blue-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    대기 중인 장소 ({places.length})
                    {activeTab === 'pending' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'approved'
                            ? 'text-blue-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    등록된 장소 ({approvedPlaces.length})
                    {activeTab === 'approved' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* 대기 중인 장소 탭 */}
            {activeTab === 'pending' && (
                <>
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
                </>
            )}

            {/* 등록된 장소 탭 */}
            {activeTab === 'approved' && (
                <>
                    {approvedPlaces.length === 0 ? (
                        <div className="bg-slate-800/50 rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-4">🍽️</div>
                            <h3 className="text-xl font-semibold text-slate-300">등록된 장소가 없습니다</h3>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {approvedPlaces.map(place => (
                                <div key={place._id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-100">{place.name}</h3>
                                            <p className="text-slate-400 text-sm mt-1">📍 {place.address}</p>
                                            {place.description && (
                                                <p className="text-slate-500 text-sm mt-2">{place.description}</p>
                                            )}
                                            <p className="text-slate-600 text-xs mt-3">
                                                등록일: {new Date(place.createdAt).toLocaleDateString('ko-KR')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => openEditModal(place)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                ✏️ 수정
                                            </button>
                                            <button
                                                onClick={() => handleDelete(place._id, true)}
                                                disabled={actionLoading === place._id}
                                                className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === place._id ? '삭제중...' : '🗑️ 삭제'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* 수정 모달 */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-4">장소 정보 수정</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">주소</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">설명</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={4}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
