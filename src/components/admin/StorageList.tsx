'use client';

import { useState } from 'react';
import axios from 'axios';
import StorageModal from './StorageModal';

interface Storage {
    _id: string;
    name: string;
    address: string;
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
        if (!confirm('정말로 삭제하시겠습니까?')) return;
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
                { isOpen: !storage.status.isOpen },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onRefresh();
        } catch (error) {
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => {
                        setSelectedStorage(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                    짐보관소 추가
                </button>
            </div>

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
                                상태
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
                                        {storage.isPremium && (
                                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Premium
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{storage.address}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleToggleStatus(storage)}
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${storage.status.isOpen
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {storage.status.isOpen ? '운영중' : '중단'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(storage)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(storage._id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {storages.map((storage) => (
                    <div key={storage._id} className="bg-white p-4 rounded-lg shadow space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {storage.name}
                                    {storage.isPremium && (
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            Premium
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{storage.address}</p>
                            </div>
                            <button
                                onClick={() => handleToggleStatus(storage)}
                                className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${storage.status.isOpen
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {storage.status.isOpen ? '운영중' : '중단'}
                            </button>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => handleEdit(storage)}
                                className="text-indigo-600 font-medium text-sm hover:text-indigo-900"
                            >
                                수정
                            </button>
                            <button
                                onClick={() => handleDelete(storage._id)}
                                className="text-red-600 font-medium text-sm hover:text-red-900"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                ))}
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
