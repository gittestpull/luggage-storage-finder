'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout, openModal } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/30">
                            <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">짐보관소</span>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">홈</Link>
                        <Link href="/news" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">뉴스</Link>
                        <Link href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">FAQ</Link>
                        <button
                            onClick={() => (window as any).requestPushPermission && (window as any).requestPushPermission()}
                            className="text-gray-600 hover:text-yellow-600 transition-colors font-medium flex items-center gap-1"
                        >
                            <span>🔔</span> 알림 받기
                        </button>
                    </nav>

                    <div className="hidden md:flex items-center space-x-3">
                        {user ? (
                            <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-700">
                                    {user.username.split('@')[0]}님
                                </span>
                                <Button variant="ghost" size="sm" onClick={logout}>로그아웃</Button>
                            </div>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => openModal('login')}>로그인</Button>
                                <Button size="sm" onClick={() => openModal('register')}>회원가입</Button>
                            </>
                        )}
                    </div>

                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                        </svg>
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100">
                    <div className="px-4 py-3 space-y-3">
                        <Link href="/" className="block text-gray-600 hover:text-blue-600 font-medium py-2">홈</Link>
                        <Link href="/news" className="block text-gray-600 hover:text-blue-600 font-medium py-2">뉴스</Link>
                        <Link href="#faq" className="block text-gray-600 hover:text-blue-600 font-medium py-2">FAQ</Link>
                        <button
                            onClick={() => {
                                (window as any).requestPushPermission && (window as any).requestPushPermission();
                                setIsMenuOpen(false);
                            }}
                            className="block w-full text-left text-gray-600 hover:text-yellow-600 font-medium py-2 flex items-center gap-2"
                        >
                            <span>🔔</span> 알림 받기
                        </button>
                        <div className="pt-3 border-t space-y-2">
                            {user ? (
                                <Button variant="outline" className="w-full" onClick={logout}>로그아웃</Button>
                            ) : (
                                <>
                                    <Button variant="outline" className="w-full" onClick={() => openModal('login')}>로그인</Button>
                                    <Button className="w-full" onClick={() => openModal('register')}>회원가입</Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
