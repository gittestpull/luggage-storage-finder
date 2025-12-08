'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
    const { modals, closeModal, login, openModal } = useAuth();
    const [isRegister, setIsRegister] = useState(false);

    // Sync internal state with global modal state if needed, but here we just use isRegister to toggle view
    // If we want to open directly to register, we might need a prop or check which modal is open
    // But since we have separate 'login' and 'register' keys in modals, we can use that.

    const isVisible = modals.login || modals.register;
    const mode = modals.register ? 'register' : 'login';

    if (!isVisible) return null;

    const handleClose = () => {
        closeModal('login');
        closeModal('register');
    };

    const switchToRegister = () => {
        closeModal('login');
        openModal('register');
    };

    const switchToLogin = () => {
        closeModal('register');
        openModal('login');
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('email'),
                    password: formData.get('password'),
                }),
            });
            const data = await res.json();
            if (data.token) {
                login(data.token, data.user);
                alert('로그인 성공!');
                handleClose();
            } else {
                alert(data.message || '로그인 실패');
            }
        } catch (error) {
            alert('로그인 중 오류가 발생했습니다.');
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        if (formData.get('password') !== formData.get('passwordConfirm')) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password'),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('회원가입 성공! 로그인해주세요.');
                switchToLogin();
            } else {
                alert(data.message || '회원가입 실패');
            }
        } catch (error) {
            alert('회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <div className="glass-modal-title">
                        {mode === 'register' ? '🎉 회원가입' : '🔐 로그인'}
                    </div>
                    <button className="glass-modal-close" onClick={handleClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="glass-modal-body">
                    {mode === 'login' ? (
                        <form onSubmit={handleLoginSubmit}>
                            <div className="form-group">
                                <label className="form-label">이메일</label>
                                <input type="email" name="email" required className="form-input" placeholder="your@email.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">비밀번호</label>
                                <input type="password" name="password" required className="form-input" placeholder="••••••••" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
                                로그인
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                                계정이 없으신가요?{' '}
                                <button type="button" onClick={switchToRegister} style={{ color: '#6366f1', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    회원가입
                                </button>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="form-group">
                                <label className="form-label">이메일</label>
                                <input type="email" name="username" required className="form-input" placeholder="your@email.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">비밀번호</label>
                                <input type="password" name="password" required className="form-input" placeholder="8자 이상" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">비밀번호 확인</label>
                                <input type="password" name="passwordConfirm" required className="form-input" placeholder="비밀번호 재입력" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                회원가입
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                                이미 계정이 있으신가요?{' '}
                                <button type="button" onClick={switchToLogin} style={{ color: '#6366f1', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    로그인
                                </button>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
