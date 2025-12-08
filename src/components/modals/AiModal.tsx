'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageLocation } from '@/types';

export default function AiModal({ goToMapLocation }: { goToMapLocation: (storage: StorageLocation) => void }) {
    const { modals, closeModal } = useAuth();
    const [aiPreferences, setAiPreferences] = useState({
        is24Hours: false,
        isPremium: false,
        budget: false,
        hasLargeLocker: false,
    });
    const [useLocation, setUseLocation] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResults, setAiResults] = useState<any[]>([]);

    if (!modals.ai) return null;

    const togglePreference = (key: keyof typeof aiPreferences) => {
        setAiPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAiRecommend = async () => {
        setAiLoading(true);
        setAiResults([]);

        try {
            let location = null;

            // 위치 사용 시 현재 위치 가져오기
            if (useLocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 5000,
                        });
                    });
                    location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                } catch {
                    console.log('위치 정보를 가져오지 못했습니다.');
                }
            }

            const res = await fetch('/api/storages/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: location?.lat,
                    longitude: location?.lng,
                    preferences: aiPreferences,
                }),
            });

            const data = await res.json();
            setAiResults(data);
        } catch (error) {
            console.error('AI 추천 오류:', error);
            alert('AI 추천 중 오류가 발생했습니다.');
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => closeModal('ai')}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <div className="glass-modal-title">
                        🤖 AI 스마트 추천
                    </div>
                    <button className="glass-modal-close" onClick={() => closeModal('ai')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="glass-modal-body">
                    {aiResults.length === 0 ? (
                        <>
                            <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                원하는 조건을 선택하면 최적의 보관소를 추천해드려요!
                            </p>

                            <div className="preference-grid">
                                {[
                                    { key: 'is24Hours', icon: '⏰', label: '24시간 운영' },
                                    { key: 'isPremium', icon: '⭐', label: '프리미엄 시설' },
                                    { key: 'budget', icon: '💰', label: '가성비 좋은' },
                                    { key: 'hasLargeLocker', icon: '🧳', label: '대형 짐 보관' },
                                ].map(({ key, icon, label }) => (
                                    <div
                                        key={key}
                                        className={`preference-option ${aiPreferences[key as keyof typeof aiPreferences] ? 'active' : ''}`}
                                        onClick={() => togglePreference(key as keyof typeof aiPreferences)}
                                    >
                                        <span className="preference-icon">{icon}</span>
                                        <span className="preference-label">{label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="location-toggle">
                                <div className="location-toggle-label">
                                    <span>📍</span>
                                    <span>내 위치 기반 추천</span>
                                </div>
                                <div
                                    className={`toggle-switch ${useLocation ? 'active' : ''}`}
                                    onClick={() => setUseLocation(!useLocation)}
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleAiRecommend}
                                disabled={aiLoading}
                            >
                                {aiLoading ? (
                                    <>
                                        <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px' }} />
                                        추천 중...
                                    </>
                                ) : (
                                    '🚀 추천받기'
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: '600', color: '#374151' }}>추천 결과 ({aiResults.length}건)</span>
                                <button
                                    onClick={() => setAiResults([])}
                                    style={{ fontSize: '0.875rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    다시 선택
                                </button>
                            </div>
                            <div className="recommendation-results">
                                {aiResults.map((result, i) => (
                                    <div
                                        key={result._id || i}
                                        className="recommendation-card"
                                        onClick={() => {
                                            closeModal('ai');
                                            goToMapLocation(result);
                                        }}
                                    >
                                        <div className="recommendation-score">점수 {result.matchScore}</div>
                                        <div className="recommendation-name">{result.name}</div>
                                        <div className="recommendation-address">{result.address}</div>
                                        {result.matchReasons?.length > 0 && (
                                            <div className="recommendation-reasons">
                                                {result.matchReasons.map((reason: string, j: number) => (
                                                    <span key={j} className="recommendation-reason">{reason}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
