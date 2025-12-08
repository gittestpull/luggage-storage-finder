'use client';

import { useState, useEffect } from 'react';

interface User {
    _id?: string;
    username: string;
    password?: string;
    points: number;
    isAdmin: boolean;
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
        password: '',
        points: 0,
        isAdmin: false,
    });

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '' }); // Password reset only
        } else {
            setFormData({
                username: '',
                password: '',
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {user ? '사용자 수정' : '사용자 추가'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">사용자 이름 (이메일)</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">
                            비밀번호 {user && '(변경 시에만 입력)'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!user}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">포인트</label>
                        <input
                            type="number"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="isAdmin"
                                checked={formData.isAdmin}
                                onChange={handleChange}
                                className="mr-2"
                            />
                            관리자 여부
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
