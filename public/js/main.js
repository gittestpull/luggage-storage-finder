document.addEventListener('DOMContentLoaded', function() {
    // 모바일 메뉴 (햄버거) 기능 초기화
    initMobileMenu();

    // 검색 기능 초기화
    initSearch();

    // 섹션 가시성 제어 함수
    const sections = document.querySelectorAll('main section');
    console.log('모든 섹션:', sections); // 디버깅용 로그 추가
    const hideAllSections = () => {
        console.log('모든 섹션 숨기기 실행'); // 디버깅용 로그 추가
        sections.forEach(section => {
            section.classList.add('hidden');
            console.log(`${section.id} 숨김 처리`); // 디버깅용 로그 추가
        });
    };

    const showSection = (ids) => {
        hideAllSections();
        const sectionIds = Array.isArray(ids) ? ids : [ids];
        console.log('표시할 섹션 ID:', sectionIds); // 디버깅용 로그 추가
        sectionIds.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.classList.remove('hidden');
                console.log(`${section.id} 표시 처리`); // 디버깅용 로그 추가
            }
        });
    };
    window.showSection = showSection; // showSection 함수를 전역으로 노출

    // 해시 변경 처리 함수
    const handleHashChange = async () => {
        const hash = window.location.hash.substring(1); // # 제거
        const mainPageContent = document.getElementById('main-page-content');
        const mainContentContainer = document.getElementById('main-content-container');

        // 모든 섹션을 숨깁니다.
        sections.forEach(section => section.classList.add('hidden'));

        let componentPath = '';

        switch (hash) {
            case 'map':
                document.getElementById('map').classList.remove('hidden');
                if (typeof initMap === 'function') {
                    initMap();
                }
                break;
            case 'list':
                document.getElementById('search').classList.remove('hidden');
                document.getElementById('list').classList.remove('hidden');
                if (document.getElementById('list')) {
                    loadStorageList();
                }
                break;
            case 'report':
                document.getElementById('report').classList.remove('hidden');
                break;
            case 'login':
                document.getElementById('login').classList.remove('hidden');
                break;
            case 'register':
                document.getElementById('register').classList.remove('hidden');
                break;
            case 'about-service':
                document.getElementById('about-service').classList.remove('hidden');
                break;
            case 'privacy-policy':
                componentPath = 'components/privacy-policy.html';
                break;
            case 'about-us':
                componentPath = 'components/about-us.html';
                break;
            case 'contact-us':
                componentPath = 'components/contact-us.html';
                break;
            case 'how-to-use':
                componentPath = 'components/how-to-use.html';
                break;
            case 'faq':
                componentPath = 'components/faq.html';
                break;
            default: // 기본적으로 메인 페이지의 모든 섹션을 표시
                mainPageContent.style.display = 'block';
                mainContentContainer.style.display = 'none';
                sections.forEach(section => section.classList.remove('hidden'));
                // loadAllComponents(); // 이미 DOM에 있으므로 다시 로드할 필요 없음
                return;
        }

        if (componentPath) {
            mainPageContent.style.display = 'none';
            mainContentContainer.style.display = 'block';
            await replaceComponent(mainContentContainer.id, componentPath);
        } else {
            mainPageContent.style.display = 'block';
            mainContentContainer.style.display = 'none';
        }
    };

    // 단일 컴포넌트 동적 교체 함수 (SPA 구현 시 사용)
    async function replaceComponent(containerId, componentPath) {
        const container = document.getElementById(containerId);
        if (!container) return false;
        
        // 페이드 아웃 효과
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.3s';
        
        // 페이드 아웃 후 내용 교체
        setTimeout(async () => {
            try {
                const response = await fetch(componentPath);
                if (!response.ok) {
                    throw new Error(`컴포넌트를 불러오지 못했습니다: ${componentPath}`);
                }
                
                const html = await response.text();
                container.innerHTML = html;
                
                // 페이드 인 효과
                container.style.opacity = '1';
                
                // 교체 완료 이벤트 발생
                window.dispatchEvent(new CustomEvent('componentReplaced', { 
                    detail: { containerId, componentPath } 
                }));
            } catch (error) {
                console.error(`컴포넌트 교체 실패:`, error);
                container.style.opacity = '1';
            }
        }, 300);
    }

    // 초기 로드 시 해시 처리 (컴포넌트 로드 완료 후 실행)
    window.addEventListener('componentsLoaded', () => {
        handleHashChange();
    });

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