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
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">사용자 관리</h2>
                    <p className="text-sm text-slate-500 mt-1">등록된 사용자 현황을 조회하고 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleMigrate}
                        className="bg-yellow-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-yellow-600 transition-colors text-sm"
                    >
                        데이터 정비
                    </button>
                    <button
                        onClick={() => {
                            setSelectedUser(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all transform hover:-translate-y-0.5 text-sm flex items-center"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        사용자 추가
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">사용자</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">포인트</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">권한</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">가입일</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm mr-3">
                                                {user.username.slice(0, 1)}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.username}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-mono">{user.points.toLocaleString()} P</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${user.isAdmin
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}
                                        >
                                            {user.isAdmin ? '관리자' : '일반 사용자'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user._id)}
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
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                onSave={handleSave}
            />
        </div>
    );
}
