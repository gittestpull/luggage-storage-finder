'use client';

import { useState, useEffect } from 'react';

interface User {
    _id?: string;
    username: string;
    points: number;
    isAdmin: boolean;
    createdAt?: string;
}

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    onSave: (user: User) => Promise<void>;
}

export default function UserModal({
    isOpen,
    onClose,
    user,
    onSave,
}: UserModalProps) {
    const [formData, setFormData] = useState<User>({
        username: '',
        points: 0,
        isAdmin: false,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
            });
        } else {
            setFormData({
                username: '',
                points: 0,
                isAdmin: false,
            });
        }
    }, [user, isOpen]);

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {user ? '사용자 정보 수정' : '새 사용자 등록'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">사용자 이름 (이메일)</label>
                        <input
                            type="email"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={!!user} // 수정 시에는 이메일 변경 불가 (보통 ID 역할)
                            className={`w-full px-4 py-3 rounded-xl border border-gray-200 transition-all outline-none ${user ? 'bg-gray-50 text-gray-500' : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                }`}
                            placeholder="user@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">포인트</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="points"
                                value={formData.points}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                            <span className="absolute right-4 top-3.5 text-gray-500 text-sm">P</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="isAdmin"
                                checked={formData.isAdmin}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">관리자 권한 부여</span>
                        </label>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                        >
                            저장하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
