'use client';

import FeedbackList from '@/components/admin/FeedbackList';

export default function AdminFeedbackPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">의견(Feedback) 관리</h1>
                <p className="text-slate-500 mt-2">
                    사용자들이 보낸 소중한 의견을 확인하고 관리합니다.
                </p>
            </div>

            <FeedbackList />
        </div>
    );
}
