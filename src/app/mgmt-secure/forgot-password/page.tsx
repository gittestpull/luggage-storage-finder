'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axios.post('/api/auth/forgot-password', { email });
            setMessage(response.data.message);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || '오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post('/api/auth/verify-code', { email, code });
            setStep(3);
            setMessage('');
        } catch (err: any) {
            setError(err.response?.data?.message || '인증번호 확인 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/auth/reset-password', {
                email,
                code,
                newPassword,
            });
            alert(response.data.message);
            router.push('/mgmt-secure/login');
        } catch (err: any) {
            setError(err.response?.data?.message || '비밀번호 변경 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">비밀번호 찾기</h1>

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendCode}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="가입한 이메일을 입력하세요"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? '전송 중...' : '인증번호 전송'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyCode}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">인증번호</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="이메일로 전송된 6자리 코드"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? '확인 중...' : '인증번호 확인'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full mt-2 text-gray-500 hover:text-gray-700"
                        >
                            이메일 다시 입력하기
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </form>
                )}

                <div className="mt-4 text-center">
                    <Link href="/mgmt-secure/login" className="text-blue-500 hover:underline">
                        로그인 페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
