'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function FeedbackModal() {
    const { modals, closeModal } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!modals.feedback) return null;

    const handleFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.get('email'),
                    content: formData.get('content'),
                }),
            });

            if (res.ok) {
                alert('소중한 의견 감사합니다! 더 좋은 서비스를 위해 노력하겠습니다. 🙇‍♂️');
                closeModal('feedback');
            } else {
                throw new Error('Feedback failed');
            }
        } catch (error) {
            alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => closeModal('feedback')}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <div className="glass-modal-title">
                        💌 의견 보내기
                    </div>
                    <button className="glass-modal-close" onClick={() => closeModal('feedback')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="glass-modal-body">
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        서비스 이용 중 불편한 점이나 제안하고 싶은 아이디어가 있다면 자유롭게 말씀해주세요.
                    </p>

                    <form onSubmit={handleFeedback}>
                        <div className="form-group">
                            <label className="form-label">이메일 (답변을 원하시면 입력해주세요)</label>
                            <input type="email" name="email" className="form-input" placeholder="example@email.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">의견 내용 *</label>
                            <textarea
                                name="content"
                                required
                                rows={5}
                                className="form-input"
                                placeholder="예: 지도 로딩이 조금 느린 것 같아요. / 이런 기능이 추가되면 좋겠어요!"
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? '전송 중...' : '의견 보내기 ✨'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
