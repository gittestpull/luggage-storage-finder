'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageLocation } from '@/types';

interface EditRequestModalProps {
    storage: StorageLocation | null;
    onClose: () => void;
}

export default function EditRequestModal({ storage, onClose }: EditRequestModalProps) {
    const [formData, setFormData] = useState({
        name: storage?.name || '',
        address: storage?.address || '',
        phoneNumber: storage?.phoneNumber || '',
        openTime: storage?.openTime || '',
        closeTime: storage?.closeTime || '',
        is24Hours: storage?.is24Hours || false,
        smallPrice: storage?.smallPrice?.toString() || '',
        largePrice: storage?.largePrice?.toString() || '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!storage) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/report/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storageId: storage._id,
                    storageName: storage.name,
                    ...formData,
                    smallPrice: formData.smallPrice ? parseInt(formData.smallPrice) : undefined,
                    largePrice: formData.largePrice ? parseInt(formData.largePrice) : undefined,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const data = await response.json();
                alert(data.message || '수정 요청 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Edit request error:', error);
            alert('수정 요청 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header">
                    <div className="glass-modal-title">
                        ✏️ 정보 수정 요청
                    </div>
                    <button className="glass-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="glass-modal-body">
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1f2937' }}>
                                수정 요청이 접수되었습니다
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                관리자 검토 후 승인되면 정보가 수정됩니다.
                            </p>
                            <button className="btn btn-primary" onClick={onClose}>
                                확인
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <p style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e' }}>
                                <strong>📢 안내:</strong> 수정 요청은 관리자 승인 후 반영됩니다.
                            </p>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                    보관소 이름 *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                    주소 *
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                    전화번호
                                </label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="02-1234-5678"
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                        오픈 시간
                                    </label>
                                    <input
                                        type="text"
                                        name="openTime"
                                        value={formData.openTime}
                                        onChange={handleChange}
                                        placeholder="09:00"
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                        마감 시간
                                    </label>
                                    <input
                                        type="text"
                                        name="closeTime"
                                        value={formData.closeTime}
                                        onChange={handleChange}
                                        placeholder="21:00"
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="is24Hours"
                                        checked={formData.is24Hours}
                                        onChange={handleChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>24시간 운영</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                        소형 가격 (원)
                                    </label>
                                    <input
                                        type="number"
                                        name="smallPrice"
                                        value={formData.smallPrice}
                                        onChange={handleChange}
                                        placeholder="3000"
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                        대형 가격 (원)
                                    </label>
                                    <input
                                        type="number"
                                        name="largePrice"
                                        value={formData.largePrice}
                                        onChange={handleChange}
                                        placeholder="5000"
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                    수정 사유 / 추가 설명
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="어떤 정보가 잘못되었는지 알려주세요"
                                    rows={3}
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn"
                                    style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {submitting ? '제출 중...' : '수정 요청'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
