'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isLoginPage = pathname === '/mgmt-secure/login';

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token && !isLoginPage) {
            router.push('/mgmt-secure/login');
        } else if (token && isLoginPage) {
            router.push('/mgmt-secure');
        }
        setIsLoading(false);
    }, [pathname, isLoginPage, router]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300">
                <header className="bg-white border-b border-slate-200 px-4 md:px-10 py-4 flex justify-between items-center sticky top-0 z-40 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 hidden sm:block">관리자 페이지</h2>
                    </div>

                    <div className="flex-1 max-w-xl mx-2 md:mx-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.elements.namedItem('search') as HTMLInputElement;
                                if (input.value.trim()) {
                                    router.push(`/mgmt-secure/search?q=${encodeURIComponent(input.value)}`);
                                }
                            }}
                            className="relative w-full"
                        >
                            <input
                                type="text"
                                name="search"
                                placeholder="검색 (사용자, 보관소, 제보...)"
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <svg
                                className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </form>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-10 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
