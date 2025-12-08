// src/components/layout/FloatingButtons.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function FloatingButtons() {
    const { openModal } = useAuth();

    return (
        <>
            {/* 의견 보내기 플로팅 버튼 (왼쪽 아래, 제보하기 위) */}
            <button
                onClick={() => openModal('feedback')}
                aria-label="의견 보내기"
                className="feedback-floating-btn"
            >
                <span style={{ fontSize: '1.2rem' }}>💌</span>
                <span>의견 보내기</span>
            </button>

            {/* 새로운 장소 제보하기 플로팅 버튼 (왼쪽 아래) */}
            <Link href="/places/new" className="report-floating-btn">
                <span className="btn-emoji">🧳</span>
                <span>장소 제보</span>
            </Link>

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
