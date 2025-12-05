'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import UserList from '@/components/admin/UserList';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">사용자 관리</h1>
            <UserList users={users} onRefresh={fetchUsers} />
        </div>
    );
}
