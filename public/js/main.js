/**
 * main.js
 * 메인 페이지의 전반적인 기능과 모바일 최적화 로직을 담당합니다.
 */

// 페이지 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 모바일 메뉴 (햄버거) 기능 초기화
    initMobileMenu();

    // 검색 기능 초기화
    initSearch();
    
    // 제보 폼 초기화
    // initReportForm(); // 해당 함수가 정의되어 있지 않으므로 주석 처리
    
    // 광고 로드
    // loadAds(); // 해당 함수가 정의되어 있지 않으므로 주석 처리
    
    // 짐보관소 목록 로드
    if (document.getElementById('list')) {
        // loadStorageList(); // 해당 함수가 정의되어 있지 않으므로 주석 처리
    }

    // 하단 배너 광고 예시 (실제로는 동적으로 생성해야 함)
    // const bannerAd = createAdCard('banner-ad'); 
    // document.body.appendChild(bannerAd);
});

/**
 * 모바일 메뉴 (햄버거) 기능 초기화
 */
function initMobileMenu() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            // 애니메이션을 위한 클래스 토글 (CSS에서 정의됨)
            setTimeout(() => {
                mobileMenu.classList.toggle('open');
            }, 10); 
        });

        // 메뉴 항목 클릭 시 메뉴 닫기
        mobileMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('open');
            }
        });
    }
}

/**
 * 검색 기능 초기화
 */
function initSearch() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton && searchInput) {
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                // 여기에 실제 검색 API 호출 로직 구현
                console.log(`검색 실행: ${query}`);
                alert(`'${query}' 검색을 실행합니다. (구현 필요)`);
                // displaySearchResults(query); // 실제 검색 결과 표시 함수 호출
            } else {
                alert('검색어를 입력해주세요.');
            }
        };

        searchButton.addEventListener('click', performSearch);
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// createAdCard, displaySearchResults, loadStorageList, initReportForm 등은
// 별도의 파일로 분리하거나 여기에 구현해야 합니다.
// 현재 정의되어 있지 않아 main.js 실행 시 오류를 발생시킬 수 있으므로,
// 호출부를 주석 처리했습니다.