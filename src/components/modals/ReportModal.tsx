'use client';

import { useAuth } from '@/context/AuthContext';

export default function ReportModal() {
    const { modals, closeModal, openModal, analysisResult, setAnalysisResult } = useAuth();

    if (!modals.report) return null;

    const handleReport = async (e: React.FormEvent<HTMLFormElement>) => {
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
                closeModal('report');
                setAnalysisResult(null);
            } else {
                alert(data.message || '제보 접수 중 오류가 발생했습니다.');
            }
        } catch (error) {
            alert('제보 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    const openPhotoScan = () => {
        closeModal('report');
        openModal('photoScan');
    };

    return (
        <div className="modal-overlay" onClick={() => closeModal('report')}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <div className="glass-modal-title">
                        📢 짐보관소 제보하기
                    </div>
                    <button className="glass-modal-close" onClick={() => closeModal('report')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="glass-modal-body">
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        새로운 짐보관소 정보를 알려주시면 검토 후 등록됩니다. 포인트도 적립해 드려요! 🎁
                    </p>

                    {!analysisResult && (
                        <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-yellow-800 text-sm mb-1">사진으로 간편하게 등록하세요!</h4>
                                <p className="text-xs text-yellow-700">간판이나 안내문을 찍으면 AI가 자동으로 입력해줍니다.</p>
                            </div>
                            <button
                                type="button"
                                onClick={openPhotoScan}
                                className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                            >
                                📸 사진 촬영
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleReport}>
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
                </div>
            </div>
        </div>
    );
}
