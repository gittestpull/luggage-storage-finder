'use client';

import { useState, useEffect } from 'react';

interface Storage {
    _id?: string;
    name: string;
    address: string;
    openTime: string;
    closeTime: string;
    is24Hours: boolean;
    smallPrice: number;
    largePrice: number;
    isPremium?: boolean;
}

interface StorageModalProps {
    isOpen: boolean;
    onClose: () => void;
    storage?: Storage | null;
    onSave: (storage: Storage) => Promise<void>;
}

export default function StorageModal({
    isOpen,
    onClose,
    storage,
    onSave,
}: StorageModalProps) {
    const [formData, setFormData] = useState<Storage>({
        name: '',
        address: '',
        openTime: '',
        closeTime: '',
        is24Hours: false,
        smallPrice: 0,
        largePrice: 0,
        isPremium: false,
    });

    useEffect(() => {
        if (storage) {
            setFormData(storage);
        } else {
            setFormData({
                name: '',
                address: '',
                openTime: '',
                closeTime: '',
                is24Hours: false,
                smallPrice: 0,
                largePrice: 0,
                isPremium: false,
            });
        }
    }, [storage, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                    {storage ? '짐보관소 수정' : '짐보관소 추가'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">이름</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">주소</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 mb-2">오픈 시간</label>
                            <input
                                type="time"
                                name="openTime"
                                value={formData.openTime}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">마감 시간</label>
                            <input
                                type="time"
                                name="closeTime"
                                value={formData.closeTime}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="is24Hours"
                                checked={formData.is24Hours}
                                onChange={handleChange}
                                className="mr-2"
                            />
                            24시간 운영
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 mb-2">소형 가격</label>
                            <input
                                type="number"
                                name="smallPrice"
                                value={formData.smallPrice}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">대형 가격</label>
                            <input
                                type="number"
                                name="largePrice"
                                value={formData.largePrice}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="isPremium"
                                checked={formData.isPremium || false}
                                onChange={handleChange}
                                className="mr-2"
                            />
                            프리미엄 보관소
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
