'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';

type TabType = 'storage' | 'place' | 'feedback';

interface Location {
    lat: number;
    lng: number;
}

export default function ReportModal() {
    const { modals, closeModal, openModal, analysisResult, setAnalysisResult, setScanMode } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('storage');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    // 장소 제보 관련 state
    const [placeName, setPlaceName] = useState('');
    const [placeAddress, setPlaceAddress] = useState('');
    const [placeDescription, setPlaceDescription] = useState('');
    const [placePhotos, setPlacePhotos] = useState<FileList | null>(null);
    const [placeLocation, setPlaceLocation] = useState<Location | null>(null);
    const [placeSubmitting, setPlaceSubmitting] = useState(false);
    const [placeMessage, setPlaceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 분석 결과가 있으면 자동으로 적용
    useEffect(() => {
        if (analysisResult && modals.report) {
            // 맛집/카페 분석 결과인 경우 (category 또는 menu 필드가 있으면)
            if (analysisResult.category !== undefined || analysisResult.menu !== undefined) {
                setActiveTab('place');
                if (analysisResult.name) setPlaceName(analysisResult.name);
                if (analysisResult.address) setPlaceAddress(analysisResult.address);
                if (analysisResult.description) setPlaceDescription(analysisResult.description);
                if (analysisResult.menu) {
                    setPlaceDescription(prev => prev ? `${prev}\n대표메뉴: ${analysisResult.menu}` : `대표메뉴: ${analysisResult.menu}`);
                }
            } else {
                // 짐보관소 분석 결과
                setActiveTab('storage');
            }
        }
    }, [analysisResult, modals.report]);

    if (!modals.report) return null;

    const handleClose = () => {
        // Reset place state
        setPlaceName('');
        setPlaceAddress('');
        setPlaceDescription('');
        setPlacePhotos(null);
        setPlaceLocation(null);
        setPlaceMessage(null);
        setPlaceSubmitting(false);
        setAnalysisResult(null);
        closeModal('report');
    };

    // 짐보관소 제보
    const handleStorageReport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    address: formData.get('address'),
                    phoneNumber: formData.get('phoneNumber') || '',
                    description: formData.get('description') || '',
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('제보해주셔서 감사합니다! 검토 후 등록됩니다.');
                handleClose();
            } else {
                alert(data.message || '제보 접수 중 오류가 발생했습니다.');
            }
        } catch (error) {
            alert('제보 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    // 맛집/카페 제보
    const handlePlaceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!placeName || !placeAddress) {
            setPlaceMessage({ type: 'error', text: '이름과 주소는 필수입니다.' });
            return;
        }
        setPlaceSubmitting(true);
        setPlaceMessage(null);

        const formData = new FormData();
        formData.append('name', placeName);
        formData.append('address', placeAddress);
        formData.append('description', placeDescription);

        if (placePhotos) {
            for (let i = 0; i < placePhotos.length; i++) {
                formData.append('photos', placePhotos[i]);
            }
        }

        try {
            const res = await fetch('/api/places', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setPlaceMessage({ type: 'success', text: '성공적으로 제보되었습니다. 관리자 승인 후 등록됩니다.' });
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } else {
                const errorData = await res.json();
                setPlaceMessage({ type: 'error', text: `오류가 발생했습니다: ${errorData.error || '알 수 없는 오류'}` });
            }
        } catch (error) {
            setPlaceMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' });
        } finally {
            setPlaceSubmitting(false);
        }
    };

    // 의견 보내기
    const handleFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFeedbackLoading(true);
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
                handleClose();
            } else {
                throw new Error('Feedback failed');
            }
        } catch (error) {
            alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const openPhotoScan = (mode: 'storage' | 'place') => {
        setScanMode(mode);
        closeModal('report');
        openModal('photoScan');
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="glass-modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <div className="glass-modal-title">
                        📢 제보하기
                    </div>
                    <button className="glass-modal-close" onClick={handleClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="report-tabs">
                    <button
                        className={`report-tab ${activeTab === 'storage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('storage')}
                    >
                        🧳 보관소
                    </button>
                    <button
                        className={`report-tab ${activeTab === 'place' ? 'active' : ''}`}
                        onClick={() => setActiveTab('place')}
                    >
                        🍽️ 맛집/카페
                    </button>
                    <button
                        className={`report-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                        onClick={() => setActiveTab('feedback')}
                    >
                        💌 의견
                    </button>
                </div>

                <div className="glass-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {/* 짐보관소 제보 탭 */}
                    {activeTab === 'storage' && (
                        <>
                            <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                새로운 짐보관소 정보를 알려주시면 검토 후 등록됩니다. 포인트도 적립해 드려요! 🎁
                            </p>

                            {!analysisResult && (
                                <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-yellow-800 text-sm mb-1">사진으로 간편하게!</h4>
                                        <p className="text-xs text-yellow-700">간판을 찍으면 AI가 자동 입력해요</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openPhotoScan('storage')}
                                        className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                                    >
                                        📸 촬영
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleStorageReport}>
                                <div className="form-group">
                                    <label className="form-label">짐보관소 이름 *</label>
                                    <input type="text" name="name" required className="form-input" placeholder="예: 홍대입구역 물품보관소" defaultValue={analysisResult?.name || ''} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">주소 *</label>
                                    <input type="text" name="address" required className="form-input" placeholder="예: 서울시 마포구 양화로 123" defaultValue={analysisResult?.address || ''} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">전화번호 (선택)</label>
                                    <input type="tel" name="phoneNumber" className="form-input" placeholder="예: 02-1234-5678" defaultValue={analysisResult?.phoneNumber || ''} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">추가 정보 (선택)</label>
                                    <textarea name="description" rows={2} className="form-input" placeholder="영업시간, 가격 등" style={{ resize: 'vertical' }} defaultValue={analysisResult ? `영업시간: ${analysisResult.openTime || ''} ~ ${analysisResult.closeTime || ''}\n소형: ${analysisResult.smallPrice || ''}원, 대형: ${analysisResult.largePrice || ''}원` : ''} />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                    제보하기 🚀
                                </button>
                            </form>
                        </>
                    )}

                    {/* 맛집/카페 제보 탭 */}
                    {activeTab === 'place' && (
                        <>
                            <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                추천하고 싶은 맛집이나 카페가 있다면 알려주세요! 검토 후 등록됩니다. ☕🍜
                            </p>

                            <div className="mb-6 p-4 bg-cyan-50 rounded-xl border border-cyan-200 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-cyan-800 text-sm mb-1">사진으로 간편하게!</h4>
                                    <p className="text-xs text-cyan-700">메뉴판/간판 사진으로 AI가 자동 입력</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openPhotoScan('place')}
                                    className="px-3 py-2 bg-cyan-400 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                                >
                                    📸 촬영
                                </button>
                            </div>

                            <form onSubmit={handlePlaceSubmit}>
                                <div className="form-group">
                                    <label className="form-label">장소 이름 *</label>
                                    <input
                                        type="text"
                                        value={placeName}
                                        onChange={(e) => setPlaceName(e.target.value)}
                                        className="form-input"
                                        placeholder="예: 을지로 3가 커피집"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">주소 *</label>
                                    <input
                                        type="text"
                                        value={placeAddress}
                                        onChange={(e) => setPlaceAddress(e.target.value)}
                                        className="form-input"
                                        placeholder="예: 서울시 중구 을지로 123"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">간단한 설명</label>
                                    <textarea
                                        value={placeDescription}
                                        onChange={(e) => setPlaceDescription(e.target.value)}
                                        rows={3}
                                        className="form-input"
                                        placeholder="예: 분위기 좋은 카페, 디저트 맛있음, 가격대 등"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">사진 (선택)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setPlacePhotos(e.target.files)}
                                        multiple
                                        className="form-input"
                                        accept="image/*"
                                    />
                                </div>

                                {placeMessage && (
                                    <div className={`p-3 rounded-md text-sm mb-4 ${placeMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {placeMessage.text}
                                    </div>
                                )}

                                <button type="submit" disabled={placeSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
                                    {placeSubmitting ? '제출 중...' : '제보하기 🍽️'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* 의견 보내기 탭 */}
                    {activeTab === 'feedback' && (
                        <>
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
                                    disabled={feedbackLoading}
                                >
                                    {feedbackLoading ? '전송 중...' : '의견 보내기 ✨'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
