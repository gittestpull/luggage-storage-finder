'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavSettings {
    showHome: boolean;
    showNews: boolean;
    showStocks: boolean;
    showPlaces: boolean;
    showFun: boolean;
    showFaq: boolean;
    showPush: boolean;
}

export default function NavigationSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<NavSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings/navigation');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: keyof NavSettings) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                alert('로그인이 필요합니다.');
                router.push('/mgmt-secure/login');
                return;
            }

            const res = await fetch('/api/admin/settings/navigation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                alert('설정이 저장되었습니다.');
            } else {
                alert('저장 실패.');
            }
        } catch (err) {
            console.error(err);
            alert('오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">로딩 중...</div>;
    if (!settings) return <div className="p-8">설정을 불러올 수 없습니다.</div>;

    const menuItems: { key: keyof NavSettings; label: string; icon: string }[] = [
        { key: 'showHome', label: '홈', icon: '🏠' },
        { key: 'showNews', label: '뉴스', icon: '📰' },
        { key: 'showStocks', label: '주식', icon: '📈' },
        { key: 'showPlaces', label: '가볼만한 곳', icon: '🗺️' },
        { key: 'showFun', label: '재미', icon: '🎮' },
        { key: 'showFaq', label: 'FAQ', icon: '❓' },
        { key: 'showPush', label: '알림 받기', icon: '🔔' },
    ];

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">네비게이션 메뉴 관리</h1>
            <p className="text-slate-500 mb-8">사용자 화면 상단 메뉴의 노출 여부를 설정합니다.</p>

            <div className="space-y-4">
                {menuItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-lg font-medium text-slate-700">{item.label}</span>
                        </div>
                        <button
                            onClick={() => handleToggle(item.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings[item.key] ? 'bg-blue-600' : 'bg-slate-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? '저장 중...' : '설정 저장'}
                </button>
            </div>
        </div>
    );
}
