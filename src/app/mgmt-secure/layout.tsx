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
            <Sidebar />
            <main className="flex-1 ml-72 p-10 overflow-y-auto min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
