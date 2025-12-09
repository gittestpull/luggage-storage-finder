// src/components/layout/FloatingButtons.tsx
'use client';

import { useAuth } from '@/context/AuthContext';

export default function FloatingButtons() {
    const { openModal } = useAuth();

    return (
        <>
            {/* 통합 제보하기 플로팅 버튼 (왼쪽 아래) */}
            <button
                onClick={() => openModal('report')}
                aria-label="제보하기"
                className="report-floating-btn"
            >
                <span className="btn-emoji">📢</span>
                <span>제보하기</span>
            </button>

            {/* AI 스마트 추천 플로팅 버튼 (오른쪽 아래) */}
            <button
                className="ai-floating-btn"
                onClick={() => openModal('ai')}
                aria-label="AI 스마트 추천"
            >
                <span className="btn-emoji">✨</span>
                <span>AI 추천</span>
            </button>
        </>
    );
}
