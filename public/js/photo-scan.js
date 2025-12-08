/**
 * photo-scan.js
 * 사진 촬영/업로드 후 AI 분석을 통해 짐보관소 정보를 자동 추출하는 기능
 */

// 모달 초기화
function initPhotoScan() {
    console.log('Photo Scan 모듈 초기화');

    // 플로팅 버튼 추가
    addPhotoScanButton();

    // 모달 HTML 삽입
    insertPhotoScanModal();

    // 이벤트 리스너 설정
    setupPhotoScanEvents();
}

// 플로팅 카메라 버튼 추가
function addPhotoScanButton() {
    const existingBtn = document.getElementById('photoScanFloatBtn');
    if (existingBtn) return;

    const floatBtn = document.createElement('button');
    floatBtn.id = 'photoScanFloatBtn';
    floatBtn.className = 'photo-scan-float-btn';
    floatBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
        <span>사진으로 등록</span>
    `;
    floatBtn.setAttribute('aria-label', '사진으로 짐보관소 등록');
    floatBtn.addEventListener('click', openPhotoScanModal);

    document.body.appendChild(floatBtn);
}

// 모달 HTML 삽입
function insertPhotoScanModal() {
    if (document.getElementById('photoScanModal')) return;

    const modalHTML = `
    <div id="photoScanModal" class="photo-scan-modal hidden" role="dialog" aria-modal="true" aria-labelledby="photoScanTitle">
        <div class="photo-scan-modal-overlay" onclick="closePhotoScanModal()"></div>
        <div class="photo-scan-modal-content">
            <div class="photo-scan-header">
                <h3 id="photoScanTitle" class="text-xl font-bold">📸 사진으로 등록</h3>
                <button class="photo-scan-close-btn" onclick="closePhotoScanModal()" aria-label="닫기">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="photo-scan-body">
                <!-- 단계 1: 이미지 선택 -->
                <div id="photoScanStep1" class="photo-scan-step">
                    <p class="text-gray-600 mb-4 text-center">짐보관소 간판이나 안내문 사진을 촬영하거나 선택해주세요.</p>
                    
                    <div class="photo-scan-buttons">
                        <label class="photo-scan-option-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                            </svg>
                            <span>카메라로 촬영</span>
                            <input type="file" id="cameraInput" accept="image/*" capture="environment" class="hidden" onchange="handleImageSelect(event)">
                        </label>
                        
                        <label class="photo-scan-option-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <span>갤러리에서 선택</span>
                            <input type="file" id="galleryInput" accept="image/*" class="hidden" onchange="handleImageSelect(event)">
                        </label>
                    </div>
                </div>
                
                <!-- 단계 2: 이미지 프리뷰 & 분석 -->
                <div id="photoScanStep2" class="photo-scan-step hidden">
                    <div class="photo-preview-container">
                        <img id="photoPreview" src="" alt="선택한 이미지 프리뷰" class="photo-preview-img">
                    </div>
                    
                    <div class="photo-scan-actions">
                        <button type="button" class="photo-scan-btn secondary" onclick="resetPhotoScan()">
                            다시 선택
                        </button>
                        <button type="button" id="analyzeBtn" class="photo-scan-btn primary" onclick="analyzeImage()">
                            <span class="btn-text">🤖 AI 분석 시작</span>
                            <span class="btn-loading hidden">
                                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                분석 중...
                            </span>
                        </button>
                    </div>
                </div>
                
                <!-- 단계 3: 분석 결과 -->
                <div id="photoScanStep3" class="photo-scan-step hidden">
                    <div class="analysis-result">
                        <div class="analysis-header">
                            <span class="analysis-badge">✅ 분석 완료</span>
                            <span id="analysisConfidence" class="confidence-badge">정확도: --%</span>
                        </div>
                        
                        <div class="analysis-fields">
                            <div class="field-group">
                                <label>상호명</label>
                                <input type="text" id="analysisName" class="analysis-input" placeholder="인식되지 않음">
                            </div>
                            <div class="field-group">
                                <label>주소</label>
                                <input type="text" id="analysisAddress" class="analysis-input" placeholder="인식되지 않음">
                            </div>
                            <div class="field-group-row">
                                <div class="field-group">
                                    <label>개장 시간</label>
                                    <input type="text" id="analysisOpenTime" class="analysis-input" placeholder="--:--">
                                </div>
                                <div class="field-group">
                                    <label>폐장 시간</label>
                                    <input type="text" id="analysisCloseTime" class="analysis-input" placeholder="--:--">
                                </div>
                            </div>
                            <div class="field-group-row">
                                <div class="field-group">
                                    <label>소형 가격</label>
                                    <input type="number" id="analysisSmallPrice" class="analysis-input" placeholder="0">
                                </div>
                                <div class="field-group">
                                    <label>대형 가격</label>
                                    <input type="number" id="analysisLargePrice" class="analysis-input" placeholder="0">
                                </div>
                            </div>
                            <div class="field-group">
                                <label>전화번호</label>
                                <input type="text" id="analysisPhone" class="analysis-input" placeholder="인식되지 않음">
                            </div>
                        </div>
                        
                        <p class="text-sm text-gray-500 text-center mt-4">
                            ⚠️ AI가 추출한 정보를 확인하고 필요시 수정해주세요.
                        </p>
                    </div>
                    
                    <div class="photo-scan-actions">
                        <button type="button" class="photo-scan-btn secondary" onclick="resetPhotoScan()">
                            다시 촬영
                        </button>
                        <button type="button" class="photo-scan-btn primary" onclick="applyToReportForm()">
                            제보 폼에 적용
                        </button>
                    </div>
                </div>
                
                <!-- 에러 표시 -->
                <div id="photoScanError" class="photo-scan-error hidden">
                    <p id="photoScanErrorMsg">오류가 발생했습니다.</p>
                    <button type="button" class="photo-scan-btn secondary mt-3" onclick="resetPhotoScan()">
                        다시 시도
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 이벤트 리스너 설정
function setupPhotoScanEvents() {
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePhotoScanModal();
        }
    });
}

// 모달 열기
function openPhotoScanModal() {
    const modal = document.getElementById('photoScanModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// 모달 닫기
function closePhotoScanModal() {
    const modal = document.getElementById('photoScanModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        resetPhotoScan();
    }
}

// 상태 초기화
function resetPhotoScan() {
    // 모든 단계 숨기기
    document.getElementById('photoScanStep1').classList.remove('hidden');
    document.getElementById('photoScanStep2').classList.add('hidden');
    document.getElementById('photoScanStep3').classList.add('hidden');
    document.getElementById('photoScanError').classList.add('hidden');

    // 이미지 초기화
    document.getElementById('photoPreview').src = '';
    document.getElementById('cameraInput').value = '';
    document.getElementById('galleryInput').value = '';

    // 분석 결과 초기화
    clearAnalysisFields();

    // 버튼 상태 초기화
    resetAnalyzeButton();
}

// 분석 결과 필드 초기화
function clearAnalysisFields() {
    document.getElementById('analysisName').value = '';
    document.getElementById('analysisAddress').value = '';
    document.getElementById('analysisOpenTime').value = '';
    document.getElementById('analysisCloseTime').value = '';
    document.getElementById('analysisSmallPrice').value = '';
    document.getElementById('analysisLargePrice').value = '';
    document.getElementById('analysisPhone').value = '';
    document.getElementById('analysisConfidence').textContent = '정확도: --%';
}

// 이미지 선택 처리
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 이미지 타입 확인
    if (!file.type.startsWith('image/')) {
        showPhotoScanError('이미지 파일만 선택할 수 있습니다.');
        return;
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
        showPhotoScanError('이미지 크기가 너무 큽니다. (최대 10MB)');
        return;
    }

    // 이미지 프리뷰 표시
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('photoPreview').src = e.target.result;
        document.getElementById('photoScanStep1').classList.add('hidden');
        document.getElementById('photoScanStep2').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// 에러 표시
function showPhotoScanError(message) {
    document.getElementById('photoScanStep1').classList.add('hidden');
    document.getElementById('photoScanStep2').classList.add('hidden');
    document.getElementById('photoScanStep3').classList.add('hidden');

    const errorDiv = document.getElementById('photoScanError');
    document.getElementById('photoScanErrorMsg').textContent = message;
    errorDiv.classList.remove('hidden');
}

// 분석 버튼 로딩 상태
function setAnalyzeButtonLoading(loading) {
    const btn = document.getElementById('analyzeBtn');
    const textSpan = btn.querySelector('.btn-text');
    const loadingSpan = btn.querySelector('.btn-loading');

    if (loading) {
        btn.disabled = true;
        textSpan.classList.add('hidden');
        loadingSpan.classList.remove('hidden');
    } else {
        btn.disabled = false;
        textSpan.classList.remove('hidden');
        loadingSpan.classList.add('hidden');
    }
}

function resetAnalyzeButton() {
    setAnalyzeButtonLoading(false);
}

// AI 이미지 분석 실행
async function analyzeImage() {
    const imageData = document.getElementById('photoPreview').src;

    if (!imageData) {
        showPhotoScanError('분석할 이미지가 없습니다.');
        return;
    }

    setAnalyzeButtonLoading(true);

    try {
        const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'AI 분석 중 오류가 발생했습니다.');
        }

        const result = await response.json();
        displayAnalysisResult(result);

    } catch (error) {
        console.error('AI 분석 오류:', error);
        showPhotoScanError(error.message || 'AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        setAnalyzeButtonLoading(false);
    }
}

// 분석 결과 표시
function displayAnalysisResult(result) {
    document.getElementById('photoScanStep2').classList.add('hidden');
    document.getElementById('photoScanStep3').classList.remove('hidden');

    // 필드에 값 설정
    document.getElementById('analysisName').value = result.name || '';
    document.getElementById('analysisAddress').value = result.address || '';
    document.getElementById('analysisOpenTime').value = result.openTime || '';
    document.getElementById('analysisCloseTime').value = result.closeTime || '';
    document.getElementById('analysisSmallPrice').value = result.smallPrice || '';
    document.getElementById('analysisLargePrice').value = result.largePrice || '';
    document.getElementById('analysisPhone').value = result.phoneNumber || '';

    // 정확도 표시
    const confidence = result.confidence ? Math.round(result.confidence * 100) : 0;
    const confidenceBadge = document.getElementById('analysisConfidence');
    confidenceBadge.textContent = `정확도: ${confidence}%`;

    // 정확도에 따른 색상
    if (confidence >= 80) {
        confidenceBadge.className = 'confidence-badge high';
    } else if (confidence >= 50) {
        confidenceBadge.className = 'confidence-badge medium';
    } else {
        confidenceBadge.className = 'confidence-badge low';
    }
}

// 제보 폼에 결과 적용
function applyToReportForm() {
    // 분석 결과 가져오기
    const name = document.getElementById('analysisName').value;
    const address = document.getElementById('analysisAddress').value;
    const openTime = document.getElementById('analysisOpenTime').value;
    const closeTime = document.getElementById('analysisCloseTime').value;
    const smallPrice = document.getElementById('analysisSmallPrice').value;
    const largePrice = document.getElementById('analysisLargePrice').value;

    // 제보 폼 필드에 값 설정
    const nameField = document.getElementById('name');
    const addressField = document.getElementById('address');
    const openTimeField = document.getElementById('openTime');
    const closeTimeField = document.getElementById('closeTime');
    const smallPriceField = document.getElementById('smallPrice');
    const largePriceField = document.getElementById('largePrice');

    if (nameField && name) nameField.value = name;
    if (addressField && address) addressField.value = address;
    if (openTimeField && openTime) openTimeField.value = openTime;
    if (closeTimeField && closeTime) closeTimeField.value = closeTime;
    if (smallPriceField && smallPrice) smallPriceField.value = smallPrice;
    if (largePriceField && largePrice) largePriceField.value = largePrice;

    // 모달 닫기
    closePhotoScanModal();

    // 제보 섹션으로 스크롤
    const reportSection = document.getElementById('report');
    if (reportSection) {
        reportSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 성공 알림
    alert('AI 분석 결과가 제보 폼에 적용되었습니다. 정보를 확인하고 위치를 선택한 후 제출해주세요.');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initPhotoScan);
