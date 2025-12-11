'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createPortal } from 'react-dom';

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
                        <Link href="/places" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">가볼만한 곳</Link>
                        <Link href="/fun" className="text-gray-600 hover:text-blue-600 transition-colors font-medium flex items-center gap-1">
                            <span>🎮</span> 재미
                        </Link>
                        <Link href="/#faq" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">FAQ</Link>
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
                                    {user?.username?.split('@')[0]}님
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

            {isMenuOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] md:hidden flex justify-end">
                    {/* Backdrop - Click to Close */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu Drawer - Slides from Right */}
                    <div
                        className="relative h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col pointer-events-auto"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className="flex flex-col h-full p-6">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <span className="text-2xl font-bold text-gray-900">메뉴</span>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    aria-label="메뉴 닫기"
                                >
                                    <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-6">
                                <Link
                                    href="/"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                                >
                                    <span className="w-8">🏠</span> 홈
                                </Link>

                                <Link
                                    href="/news"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                                >
                                    <span className="w-8">📰</span> 뉴스
                                </Link>

                                <Link
                                    href="/places"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                                >
                                    <span className="w-8">🗺️</span> 가볼만한 곳
                                </Link>

                                <Link
                                    href="/fun"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                                >
                                    <span className="w-8">🎮</span> 재미
                                </Link>

                                <Link
                                    href="/#faq"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                                >
                                    <span className="w-8">❓</span> FAQ
                                </Link>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-6 border-t border-gray-100 shrink-0">
                                <button
                                    onClick={() => {
                                        (window as any).requestPushPermission && (window as any).requestPushPermission();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-md mb-4 active:scale-95 transition-transform"
                                >
                                    <span>🔔</span> 알림 받기
                                </button>

                                {user ? (
                                    <div className="space-y-3">
                                        <div className="text-center font-medium text-gray-600">
                                            {user?.username?.split('@')[0]}님 안녕하세요!
                                        </div>
                                        <Button variant="outline" className="w-full py-4 text-lg" onClick={() => { logout(); setIsMenuOpen(false); }}>
                                            로그아웃
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="w-full py-4 text-lg bg-white" onClick={() => { openModal('login'); setIsMenuOpen(false); }}>
                                            로그인
                                        </Button>
                                        <Button className="w-full py-4 text-lg bg-blue-600 text-white" onClick={() => { openModal('register'); setIsMenuOpen(false); }}>
                                            회원가입
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
}
