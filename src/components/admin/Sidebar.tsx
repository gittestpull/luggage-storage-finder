'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => pathname === path;

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/mgmt-secure/login');
    };

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col h-screen fixed left-0 top-0">
            <div className="p-4 text-2xl font-bold">관리자 패널</div>
            <nav className="flex-grow">
                <Link
                    href="/mgmt-secure"
                    className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${isActive('/mgmt-secure') ? 'bg-gray-700' : ''
                        }`}
                >
                    대시보드
                </Link>
                <Link
                    href="/mgmt-secure/storages"
                    className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${isActive('/mgmt-secure/storages') ? 'bg-gray-700' : ''
                        }`}
                >
                    짐보관소 관리
                </Link>
                <Link
                    href="/mgmt-secure/reports"
                    className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${isActive('/mgmt-secure/reports') ? 'bg-gray-700' : ''
                        }`}
                >
                    제보 관리
                </Link>
                <Link
                    href="/mgmt-secure/users"
                    className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${isActive('/mgmt-secure/users') ? 'bg-gray-700' : ''
                        }`}
                >
                    사용자 관리
                </Link>
                <Link
                    href="/mgmt-secure/premium"
                    className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${isActive('/mgmt-secure/premium') ? 'bg-gray-700' : ''
                        }`}
                >
                    프리미엄 관리
                </Link>
                <Link
                    href="/mgmt-secure/access-logs"
                    className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${isActive('/mgmt-secure/access-logs') ? 'bg-gray-700' : ''
                        }`}
                >
                    🔒 접속 기록
                </Link>
            </nav>
            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-200"
                >
                    로그아웃
                </button>
            </div>
        </aside>
    );
}
