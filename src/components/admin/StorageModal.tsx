'use client';

import { useState, useEffect } from 'react';

interface Storage {
    _id?: string;
    name: string;
    address: string;
    phoneNumber?: string;
    openTime: string;
    closeTime: string;
    is24Hours: boolean;
    smallPrice: number;
    largePrice: number;
    lockerCounts?: string;
    isPremium?: boolean;
    status?: { isOpen: boolean };
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
        phoneNumber: '',
        openTime: '',
        closeTime: '',
        is24Hours: false,
        smallPrice: 0,
        largePrice: 0,
        lockerCounts: '',
        isPremium: false,
        status: { isOpen: true },
    });

    useEffect(() => {
        if (storage) {
            setFormData({
                ...storage,
                phoneNumber: storage.phoneNumber || '',
                lockerCounts: storage.lockerCounts || '',
                status: storage.status || { isOpen: true },
            });
        } else {
            setFormData({
                name: '',
                address: '',
                phoneNumber: '',
                openTime: '',
                closeTime: '',
                is24Hours: false,
                smallPrice: 0,
                largePrice: 0,
                lockerCounts: '',
                isPremium: false,
                status: { isOpen: true },
            });
        }
    }, [storage, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
                {/* Header */}
                <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {storage ? '짐보관소 수정' : '새 짐보관소 등록'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            보관소의 상세 정보를 입력해주세요.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* 기본 정보 섹션 */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg mr-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </span>
                            기본 정보
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">보관소 이름</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="예: 서울역 1번출구 보관소"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="도로명 주소를 입력하세요"
                                />
                                <p className="text-xs text-gray-500 mt-1 ml-1">주소 변경 시 지도 위치가 자동으로 업데이트됩니다.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="02-1234-5678"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">보관함 수량 정보</label>
                                <input
                                    type="text"
                                    name="lockerCounts"
                                    value={formData.lockerCounts}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="예: 소형 10개, 대형 5개"
                                />
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* 운영 정보 섹션 */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-600 p-1.5 rounded-lg mr-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            운영 정보
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4 col-span-2 bg-gray-50 p-4 rounded-xl">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is24Hours"
                                        checked={formData.is24Hours}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">24시간 운영</span>
                                </label>
                            </div>

                            {!formData.is24Hours && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">오픈 시간</label>
                                        <input
                                            type="time"
                                            name="openTime"
                                            value={formData.openTime}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">마감 시간</label>
                                        <input
                                            type="time"
                                            name="closeTime"
                                            value={formData.closeTime}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* 가격 및 설정 섹션 */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg mr-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            가격 및 설정
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">소형 보관함 가격 (4시간)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-500">₩</span>
                                    <input
                                        type="number"
                                        name="smallPrice"
                                        value={formData.smallPrice}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">대형 보관함 가격 (4시간)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-500">₩</span>
                                    <input
                                        type="number"
                                        name="largePrice"
                                        value={formData.largePrice}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isPremium"
                                        checked={formData.isPremium || false}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">프리미엄 보관소 (상단 노출 & 강조)</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                        >
                            저장하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
