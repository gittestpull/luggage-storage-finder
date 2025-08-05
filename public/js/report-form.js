/**
 * report-form.js
 * 짐보관소 제보 폼 관련 기능을 담당합니다.
 */

// 제보 폼 초기화 및 이벤트 설정
function initReportForm() {
    const reportForm = document.getElementById('reportForm');
    if (!reportForm) return;
    
    // 위치 선택 UI 추가
    addLocationSelectUI(reportForm);
    
    // 폼 제출 이벤트 설정
    setupFormSubmission(reportForm);
}



// 위치 선택 UI 추가
function addLocationSelectUI(reportForm) {
    // 위치 정보 표시 영역 추가
    const locationInfoContainer = document.createElement('div');
    locationInfoContainer.className = 'mt-4 mb-4 hidden text-center p-2 bg-blue-100 rounded';
    locationInfoContainer.id = 'locationInfo';
    locationInfoContainer.textContent = '지도를 클릭하여 정확한 위치를 선택해주세요.';
    
    // 지도로 위치 선택 버튼 추가
    const locationSelectRow = document.createElement('div');
    locationSelectRow.className = 'mb-4';
    locationSelectRow.innerHTML = `
        <label class="block text-gray-700 mb-2">위치 선택</label>
        <div class="flex flex-wrap justify-center gap-2">
            <button type="button" id="selectLocationBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                지도에서 위치 선택하기
            </button>
            <button type="button" id="myLocationBtn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                내 위치 사용하기
            </button>
        </div>
    `;
    
    // 주소 필드 뒤에 삽입
    const addressField = reportForm.querySelector('input[name="address"]').parentNode;
    addressField.parentNode.insertBefore(locationSelectRow, addressField.nextSibling);
    addressField.parentNode.insertBefore(locationInfoContainer, locationSelectRow.nextSibling);
    
    // 위치 선택 버튼 이벤트
    setupLocationSelectButtons();
}

// 위치 선택 버튼에 이벤트 연결
function setupLocationSelectButtons() {
    // 지도에서 선택하기 버튼
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    if (selectLocationBtn) {
        selectLocationBtn.addEventListener('click', function() {
            const mapSection = document.getElementById('map');
            if (mapSection) {
                // 지도 섹션으로 스크롤
                mapSection.scrollIntoView({ behavior: 'smooth' });
                // 안내 메시지
                alert('지도에서 짐보관소의 정확한 위치를 클릭해주세요.');
            }
        });
    }
    
    // 내 위치 사용하기 버튼
    const myLocationBtn = document.getElementById('myLocationBtn');
    if (myLocationBtn) {
        myLocationBtn.addEventListener('click', function() {
            useMyLocationForReport();
        });
    }
}

// 내 위치 사용하기
function useMyLocationForReport() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // 지도 중심 변경 및 마커 표시
                if (googleMap) {
                    googleMap.setCenter({ lat, lng });
                    googleMap.setZoom(17); // 더 가깝게 확대
                    updateReportMarker(googleMap, lat, lng);
                }
                
                // 폼에 위치 정보 설정
                const latInput = document.getElementById('lat');
                const lngInput = document.getElementById('lng');
                
                if (latInput && lngInput) {
                    latInput.value = lat;
                    lngInput.value = lng;
                    
                    // 위치 정보 표시
                    const locationInfo = document.getElementById('locationInfo');
                    if (locationInfo) {
                        locationInfo.textContent = `내 위치: 위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)}`;
                        locationInfo.classList.remove('hidden');
                    }
                    
                    // 지도로 스크롤
                    const mapSection = document.getElementById('map');
                    if (mapSection) {
                        mapSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            },
            (error) => {
                console.error("위치 정보를 가져올 수 없습니다:", error);
                alert("위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 접근 권한을 확인해주세요.");
            }
        );
    } else {
        alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
}

// 폼 제출 이벤트 설정
function setupFormSubmission(reportForm) {
    reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 필수 필드 검사
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const lat = document.getElementById('lat').value;
        const lng = document.getElementById('lng').value;
        
        if (!name || !address) {
            alert('짐보관소 이름과 주소를 입력해주세요.');
            return;
        }
        
        if (!lat || !lng) {
            alert('지도에서 정확한 위치를 선택해주세요.');
            return;
        }
        
        try {
            // 제출 버튼 비활성화 및 상태 표시
            const submitBtn = reportForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '제출 중...';
            
            // 폼 데이터 수집
            const formData = new FormData(reportForm);
            
            // 24시간 여부 추가
            const openTime = document.getElementById('openTime').value;
            const closeTime = document.getElementById('closeTime').value;
            const is24Hours = (!openTime && !closeTime) || (openTime === "00:00" && closeTime === "24:00");
            formData.append('is24Hours', is24Hours);
            
            // API 요청
            const result = await submitStorageReport(formData);
            
            console.log('제보 성공:', result);
            alert('짐보관소 제보가 완료되었습니다! 검토 후 적립금이 지급됩니다. 감사합니다!');
            
            // 폼 초기화
            reportForm.reset();
            
            // 제보 마커 제거
            if (reportMarker) {
                reportMarker.setMap(null);
                reportMarker = null;
            }
            
            // 위치 정보 숨김
            const locationInfo = document.getElementById('locationInfo');
            if (locationInfo) {
                locationInfo.classList.add('hidden');
            }
            
            // 리스트 새로고침 (새로운 데이터 반영)
            loadStorageList();
            
            // 지도 새로고침 (새로운 데이터 반영)
            if (googleMap) {
                loadStoragesToMap(googleMap);
            }
        } catch (error) {
            console.error('제보 오류:', error);
            alert(error.message || '제보 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            // 제출 버튼 복원
            const submitBtn = reportForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

