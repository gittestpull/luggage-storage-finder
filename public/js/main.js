/**
 * main.js
 * 메인 페이지 기능을 담당합니다.
 */

// 페이지 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 검색 기능
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                // 검색 API 호출
                displaySearchResults(query);
            } else {
                alert('검색어를 입력해주세요.');
            }
        });
        
        // 엔터키로 검색
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });
    }
    
    // 제보 폼 초기화
    initReportForm();
    
    // 광고 로드
    loadAds();
    
    // 짐보관소 목록 로드
    if (document.getElementById('list')) {
        loadStorageList();
    }

    // 하단 배너 광고 추가
    const bannerAd = createAdCard('banner-ad');
    document.body.appendChild(bannerAd);
});

// 광고 로딩 함수
function loadAds() {
    // 광고 컨테이너 생성
    const adContainers = document.createElement('div');
    adContainers.className = 'ad-container';
    adContainers.innerHTML = '<p>광고 영역 - 귀하의 비즈니스를 홍보하세요!</p>';
    
    // 적절한 위치에 광고 삽입
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
        // 리스트 섹션 뒤에 광고 삽입
        const listSection = document.getElementById('list');
        if (listSection && listSection.nextSibling) {
            mainContainer.insertBefore(adContainers, listSection.nextSibling);
        }
    }
}