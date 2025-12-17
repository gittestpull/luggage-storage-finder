'use client';

import { useState } from 'react';
import axios from 'axios';
import UserModal from './UserModal';

interface User {
    _id: string;
    username: string;
    points: number;
    isAdmin: boolean;
    createdAt: string;
}

interface UserListProps {
    users: User[];
    onRefresh: () => void;
}

export default function UserList({ users, onRefresh }: UserListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말로 삭제하시겠습니까?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onRefresh();
        } catch (error) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleSave = async (userData: any) => {
        try {
            const token = localStorage.getItem('adminToken');
            if (selectedUser) {
                await axios.put(`/api/admin/users/${selectedUser._id}`, userData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post('/api/admin/users', userData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            onRefresh();
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    const handleMigrate = async () => {
        if (!confirm('createdAt이 없는 사용자들의 가입일을 오늘 날짜로 설정하시겠습니까?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post('/api/admin/migrate-users', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert(`마이그레이션 완료! ${response.data.updatedCount}명의 사용자가 업데이트되었습니다.`);
            onRefresh();
        } catch (error) {
            alert('마이그레이션 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <div className="mb-4 flex justify-end gap-2">
                <button
                    onClick={handleMigrate}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                    가입일 마이그레이션
                </button>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    사용자 추가
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                사용자 이름
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                포인트
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                권한
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                가입일
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                관리
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {user.username}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{user.points}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isAdmin
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {user.isAdmin ? '관리자' : '일반'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user._id)}
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
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                onSave={handleSave}
            />
        </div>
    );
}
