'use client';

import { useState, useEffect } from 'react';

export default function AdminHoneypot() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        // Log this access attempt
        fetch('/api/honeypot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/admin', action: 'page_view' }),
        }).catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Log login attempt
        await fetch('/api/honeypot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: '/admin',
                action: 'login_attempt',
                data: { username }
            }),
        }).catch(() => { });

        setAttempts(prev => prev + 1);

        // Always show error after fake delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setPassword('');
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">관리자 로그인</h1>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-700 mb-2">
                            사용자 이름
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 mb-2">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                        로그인
                    </button>
                </form>
            </div>
        </div>
    );
}
