'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function PhotoScanModal() {
    const { modals, closeModal, openModal, setAnalysisResult, scanMode } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localAnalysisResult, setLocalAnalysisResult] = useState<any>(null);

    if (!modals.photoScan) return null;

    const isStorageMode = scanMode === 'storage';
    const modeTitle = isStorageMode ? '짐보관소' : '맛집/카페';
    const modeDescription = isStorageMode
        ? '짐보관소 간판이나 안내문 사진을 촬영하거나 선택해주세요.'
        : '맛집/카페의 간판이나 메뉴판 사진을 촬영하거나 선택해주세요.';

    const handleClose = () => {
        closeModal('photoScan');
        resetState();
    };

    const resetState = () => {
        setStep(1);
        setSelectedImage(null);
        setError(null);
        setLocalAnalysisResult(null);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 선택할 수 있습니다.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('이미지 크기가 너무 큽니다. (최대 10MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string);
            setStep(2);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const analyzePhoto = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: selectedImage,
                    mode: scanMode // 모드 전달
                }),
            });

            if (!res.ok) {
                // 429 = 요청 제한 초과
                if (res.status === 429) {
                    throw new Error('AI 분석 요청이 많아 잠시 후 다시 시도해주세요. (약 1분 후)');
                }
                // JSON 응답 파싱 시도
                try {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'AI 분석 중 오류가 발생했습니다.');
                } catch {
                    throw new Error('AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
                }
            }

            const result = await res.json();
            setLocalAnalysisResult(result);
            setStep(3);
        } catch (error: any) {
            setError(error.message || 'AI 분석 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const applyAnalysisToReport = () => {
        if (!localAnalysisResult) return;
        setAnalysisResult(localAnalysisResult);
        closeModal('photoScan');
        openModal('report');
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="glass-modal-header">
                    <div className="glass-modal-title">
                        📸 {modeTitle} 사진 등록
                    </div>
                    <button className="glass-modal-close" onClick={handleClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="glass-modal-body">
                    {error && (
                        <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                            {error}
                            <button onClick={resetState} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}>
                                다시 시도
                            </button>
                        </div>
                    )}

                    {/* 단계 1: 이미지 선택 */}
                    {step === 1 && !error && (
                        <>
                            <p style={{ color: '#6b7280', marginBottom: '1.5rem', textAlign: 'center' }}>
                                {modeDescription}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <label className="photo-scan-option">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '32px', height: '32px' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                    </svg>
                                    <span>카메라로 촬영</span>
                                    <input type="file" accept="image/*" capture="environment" onChange={handleImageSelect} style={{ display: 'none' }} />
                                </label>
                                <label className="photo-scan-option">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '32px', height: '32px' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                                    </svg>
                                    <span>갤러리에서 선택</span>
                                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </>
                    )}

                    {/* 단계 2: 이미지 프리뷰 & 분석 */}
                    {step === 2 && (
                        <>
                            <div style={{ width: '100%', aspectRatio: '4/3', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                                {selectedImage && <img src={selectedImage} alt="선택한 이미지" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={resetState} className="btn btn-secondary" style={{ flex: 1 }}>
                                    다시 선택
                                </button>
                                <button onClick={analyzePhoto} className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> 분석 중...</>
                                    ) : (
                                        '🤖 AI 분석'
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* 단계 3: 분석 결과 - 짐보관소 모드 */}
                    {step === 3 && localAnalysisResult && isStorageMode && (
                        <>
                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '600', color: '#10b981' }}>✅ 분석 완료</span>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: localAnalysisResult.confidence >= 0.8 ? '#d1fae5' : localAnalysisResult.confidence >= 0.5 ? '#fef3c7' : '#fee2e2', color: localAnalysisResult.confidence >= 0.8 ? '#065f46' : localAnalysisResult.confidence >= 0.5 ? '#92400e' : '#991b1b' }}>
                                        정확도: {Math.round((localAnalysisResult.confidence || 0) * 100)}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>상호명</label>
                                        <input type="text" value={localAnalysisResult.name || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, name: e.target.value })} className="form-input" style={{ marginTop: '4px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>주소</label>
                                        <input type="text" value={localAnalysisResult.address || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, address: e.target.value })} className="form-input" style={{ marginTop: '4px' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>개장 시간</label>
                                            <input type="text" value={localAnalysisResult.openTime || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, openTime: e.target.value })} className="form-input" style={{ marginTop: '4px' }} placeholder="HH:MM" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>폐장 시간</label>
                                            <input type="text" value={localAnalysisResult.closeTime || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, closeTime: e.target.value })} className="form-input" style={{ marginTop: '4px' }} placeholder="HH:MM" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>소형 가격</label>
                                            <input type="number" value={localAnalysisResult.smallPrice || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, smallPrice: e.target.value })} className="form-input" style={{ marginTop: '4px' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>대형 가격</label>
                                            <input type="number" value={localAnalysisResult.largePrice || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, largePrice: e.target.value })} className="form-input" style={{ marginTop: '4px' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={resetState} className="btn btn-secondary" style={{ flex: 1 }}>
                                    다시 촬영
                                </button>
                                <button onClick={applyAnalysisToReport} className="btn btn-primary" style={{ flex: 1 }}>
                                    제보 폼에 적용
                                </button>
                            </div>
                        </>
                    )}

                    {/* 단계 3: 분석 결과 - 맛집/카페 모드 */}
                    {step === 3 && localAnalysisResult && !isStorageMode && (
                        <>
                            <div style={{ background: '#f0fdfa', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '600', color: '#0d9488' }}>✅ 분석 완료</span>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: localAnalysisResult.confidence >= 0.8 ? '#ccfbf1' : localAnalysisResult.confidence >= 0.5 ? '#fef3c7' : '#fee2e2', color: localAnalysisResult.confidence >= 0.8 ? '#115e59' : localAnalysisResult.confidence >= 0.5 ? '#92400e' : '#991b1b' }}>
                                        정확도: {Math.round((localAnalysisResult.confidence || 0) * 100)}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>가게 이름</label>
                                        <input type="text" value={localAnalysisResult.name || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, name: e.target.value })} className="form-input" style={{ marginTop: '4px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>주소</label>
                                        <input type="text" value={localAnalysisResult.address || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, address: e.target.value })} className="form-input" style={{ marginTop: '4px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>카테고리</label>
                                        <input type="text" value={localAnalysisResult.category || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, category: e.target.value })} className="form-input" style={{ marginTop: '4px' }} placeholder="예: 카페, 한식, 양식 등" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>대표 메뉴 / 추천</label>
                                        <input type="text" value={localAnalysisResult.menu || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, menu: e.target.value })} className="form-input" style={{ marginTop: '4px' }} placeholder="예: 아메리카노, 디저트" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>설명</label>
                                        <textarea value={localAnalysisResult.description || ''} onChange={(e) => setLocalAnalysisResult({ ...localAnalysisResult, description: e.target.value })} className="form-input" style={{ marginTop: '4px', resize: 'vertical' }} rows={2} placeholder="분위기, 특징 등" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={resetState} className="btn btn-secondary" style={{ flex: 1 }}>
                                    다시 촬영
                                </button>
                                <button onClick={applyAnalysisToReport} className="btn btn-primary" style={{ flex: 1 }}>
                                    제보 폼에 적용
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
