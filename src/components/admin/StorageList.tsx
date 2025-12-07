'use client';

import { useState } from 'react';
import axios from 'axios';
import StorageModal from './StorageModal';

interface Storage {
    _id: string;
    name: string;
    address: string;
    phoneNumber?: string;
    lockerCounts?: string;
    openTime: string;
    closeTime: string;
    is24Hours: boolean;
    smallPrice: number;
    largePrice: number;
    isPremium: boolean;
    status: { isOpen: boolean };
}

interface StorageListProps {
    storages: Storage[];
    onRefresh: () => void;
}

export default function StorageList({ storages, onRefresh }: StorageListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);

    const handleEdit = (storage: Storage) => {
        setSelectedStorage(storage);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/admin/storages/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onRefresh();
        } catch (error) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleSave = async (storageData: any) => {
        try {
            const token = localStorage.getItem('adminToken');
            if (selectedStorage) {
                await axios.put(`/api/admin/storages/${selectedStorage._id}`, storageData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post('/api/admin/storages', storageData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            onRefresh();
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    const handleToggleStatus = async (storage: Storage) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.patch(
                `/api/admin/storages/${storage._id}/status`,
                { isOpen: !storage.status?.isOpen },
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
                    <h2 className="text-xl font-bold text-slate-800">짐보관소 목록</h2>
                    <p className="text-sm text-slate-500 mt-1">등록된 모든 짐보관소를 관리합니다.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedStorage(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all transform hover:-translate-y-0.5 flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    짐보관소 추가
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">이름 / 주소</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">가격 (소/대)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(storages) && storages.map((storage) => (
                                <tr key={storage._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 flex items-center">
                                                    {storage.name}
                                                    {storage.isPremium && (
                                                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                            PREMIUM
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-0.5 max-w-md truncate">
                                                    {storage.address}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
                                                    {storage.is24Hours ? (
                                                        <span className="flex items-center text-green-600">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            24시간
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-slate-500">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {storage.openTime || '?'} - {storage.closeTime || '?'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">₩{storage.smallPrice?.toLocaleString() ?? '0'}</div>
                                        <div className="text-sm text-gray-500">₩{storage.largePrice?.toLocaleString() ?? '0'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleStatus(storage)}
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm transition-all ${storage.status?.isOpen
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                        >
                                            {storage.status?.isOpen ? '운영중' : '운영중단'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleEdit(storage)}
                                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(storage._id)}
                                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <StorageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                storage={selectedStorage}
                onSave={handleSave}
            />
        </div>
    );
}
