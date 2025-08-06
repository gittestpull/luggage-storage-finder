document.addEventListener('DOMContentLoaded', function() {
    // 모바일 메뉴 (햄버거) 기능 초기화
    initMobileMenu();

    // 검색 기능 초기화
    initSearch();

    // 섹션 가시성 제어 함수
    const sections = document.querySelectorAll('main section');
    const hideAllSections = () => {
        sections.forEach(section => section.classList.add('hidden'));
    };

    const showSection = (id) => {
        hideAllSections();
        const section = document.getElementById(id);
        if (section) {
            section.classList.remove('hidden');
        }
    };
    window.showSection = showSection; // showSection 함수를 전역으로 노출

    // 해시 변경 처리 함수
    const handleHashChange = () => {
        const hash = window.location.hash;
        hideAllSections(); // 모든 섹션을 먼저 숨깁니다.

        switch (hash) {
            case '#map':
                showSection('map');
                if (typeof initMap === 'function') {
                    initMap();
                }
                break;
            case '#list':
                showSection('list');
                if (document.getElementById('list')) {
                    loadStorageList();
                }
                break;
            case '#report':
                showSection('report');
                break;
            case '#login':
                showSection('login');
                break;
            case '#register':
                showSection('register');
                break;
            default: // 기본적으로 지도 섹션을 표시
                showSection('map');
                if (typeof initMap === 'function') {
                    initMap();
                }
                break;
        }
    };

    // 초기 로드 시 해시 처리
    handleHashChange();

    // 해시 변경 이벤트 리스너
    window.addEventListener('hashchange', handleHashChange);

    // 네비게이션 링크 클릭 이벤트 (기존 HTML에 있는 링크들이 해시를 변경하도록)
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            // 기본 동작 방지 (페이지 새로고침 방지)
            e.preventDefault(); 
            // 해시 변경
            window.location.hash = e.target.getAttribute('href');
        });
    });

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