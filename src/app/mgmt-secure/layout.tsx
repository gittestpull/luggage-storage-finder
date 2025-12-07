'use client';

import Sidebar from '@/components/admin/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isLoginPage = pathname === '/mgmt-secure/login' || pathname === '/mgmt-secure/forgot-password';
        const token = localStorage.getItem('adminToken');

        if (!token && !isLoginPage) {
            router.push('/mgmt-secure/login');
        } else if (token && isLoginPage) {
            router.push('/mgmt-secure');
        } else {
            setIsLoading(false);
        }
    }, [pathname, router]);

    const isLoginPage = pathname === '/mgmt-secure/login' || pathname === '/mgmt-secure/forgot-password';

    if (isLoading) return null; // Or a nice spinner

    if (isLoginPage) return <div className="min-h-screen bg-slate-50">{children}</div>;

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <div className="flex-1 ml-72">
                {/* Top Header can go here if needed later */}
                <main className="p-10 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
