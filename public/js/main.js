document.addEventListener('DOMContentLoaded', function() {
    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                    // 푸시 구독 로직
                    requestNotificationPermission(registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // 푸시 알림 권한 요청 및 구독
    async function requestNotificationPermission(registration, storageId = null) {
        if (!('Notification' in window) || !('PushManager' in window)) {
            console.warn('이 브라우저는 푸시 알림을 지원하지 않습니다.');
            alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('알림 권한 허용됨.');
            try {
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array('BEOlOiEIrR-D0n-H140Evw9VmgAr5LUvlkVDZPPlJvO1WtNYfVrRkdlWj-40ILyK9Hs9QeB4oUkft05V3l__nxQ') // VAPID 공개 키
                });
                console.log('푸시 구독 성공:', subscription);
                // 구독 정보를 백엔드로 전송
                await sendSubscriptionToBackend(subscription, storageId);
            } catch (error) {
                console.error('푸시 구독 실패:', error);
                alert('푸시 알림 구독에 실패했습니다. 브라우저 설정을 확인해주세요.');
            }
        } else {
            console.warn('알림 권한 거부됨.');
            alert('푸시 알림 권한이 거부되었습니다. 알림을 받으려면 브라우저 설정을 변경해주세요.');
        }
    }

    // VAPID 공개 키를 Uint8Array로 변환하는 헬퍼 함수
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // 구독 정보를 백엔드로 전송하는 함수
    async function sendSubscriptionToBackend(subscription, storageId) {
        try {
            const token = localStorage.getItem('userToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = storageId ? `/api/storages/${storageId}/subscribe` : '/api/subscribe';

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(subscription),
            });
            if (response.ok) {
                // alert('알림 구독이 성공적으로 완료되었습니다!'); // 메시지 제거
                console.log('구독 정보 백엔드 전송 성공');
            } else {
                const errorData = await response.json();
                if (errorData.message !== '이미 구독 중입니다.') { // 중복 구독 메시지는 알림창 띄우지 않음
                    console.error(`알림 구독 실패: ${errorData.message || '알 수 없는 오류'}`); // alert 대신 console.error
                }
                console.error('구독 정보 백엔드 전송 실패', await response.text());
            }
        } catch (error) {
            console.error('구독 정보 전송 중 오류 발생:', error);
            // alert('알림 구독 중 오류가 발생했습니다.'); // 알림 제거
        }
    }

    // 특정 짐보관소 알림 구독 함수 (전역 노출)
    window.subscribeToStorageNotifications = async (storageId, storageName) => {
        console.log(`${storageName}에 대한 알림 구독 요청`);
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await requestNotificationPermission(registration, storageId);
        } else {
            console.error('서비스 워커가 등록되지 않아 알림을 받을 수 없습니다. 페이지를 새로고침 해주세요.'); // alert 대신 console.error
        }
    };

    // 모바일 메뉴 (햄버거) 기능 초기화
    initMobileMenu();

    // 검색 기능 초기화
    initSearch();

    // data-include 속성을 가진 요소들을 로드하는 함수
    async function loadIncludes() {
        console.log('loadIncludes 함수 시작');
        const includeElements = document.querySelectorAll('[data-include]');
        console.log(`발견된 data-include 요소: ${includeElements.length}개`);
        for (const el of includeElements) {
            const componentPath = el.getAttribute('data-include');
            console.log(`컴포넌트 로드 시도: ${componentPath}`);
            try {
                const response = await fetch(componentPath);
                if (!response.ok) {
                    throw new Error(`컴포넌트를 불러오지 못했습니다: ${componentPath} (상태: ${response.status})`);
                }
                const html = await response.text();
                el.innerHTML = html;
                console.log(`컴포넌트 로드 성공: ${componentPath}`);
            } catch (error) {
                console.error(`컴포넌트 로드 실패: ${componentPath}`, error);
            }
        }
        console.log('모든 data-include 컴포넌트 로드 완료. componentsLoaded 이벤트 발생.');
        window.dispatchEvent(new CustomEvent('componentsLoaded'));
    }

    // 초기 로드 시 모든 data-include 컴포넌트 로드
    loadIncludes();

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
        console.log('handleHashChange 함수 시작');
        const hash = window.location.hash.substring(1); // # 제거
        console.log(`현재 해시: #${hash}`);
        const mainPageContent = document.getElementById('main-page-content');
        const mainContentContainer = document.getElementById('main-content-container');

        // 모든 섹션을 숨깁니다.
        sections.forEach(section => section.classList.add('hidden'));

        let componentPath = '';

        switch (hash) {
            case 'map':
                console.log('지도 섹션 표시');
                document.getElementById('map').classList.remove('hidden');
                if (typeof initMap === 'function') {
                    initMap();
                }
                break;
            case 'list':
                console.log('리스트 섹션 표시');
                document.getElementById('search').classList.remove('hidden');
                document.getElementById('list').classList.remove('hidden');
                if (document.getElementById('list')) {
                    loadStorageList();
                }
                break;
            case 'report':
                console.log('제보하기 섹션 표시 및 지도 초기화');
                document.getElementById('report').classList.remove('hidden');
                // 제보하기 섹션에서 지도를 함께 표시
                document.getElementById('map').classList.remove('hidden');
                if (typeof initMap === 'function') {
                    initMap();
                }
                if (typeof initReportForm === 'function') {
                    initReportForm();
                }
                break;
            case 'login':
                console.log('로그인 섹션 표시');
                document.getElementById('login').classList.remove('hidden');
                break;
            case 'register':
                console.log('회원가입 섹션 표시');
                document.getElementById('register').classList.remove('hidden');
                break;
            case 'about-service':
                console.log('서비스 소개 섹션 표시');
                document.getElementById('about-service').classList.remove('hidden');
                break;
            case 'privacy-policy':
                componentPath = 'components/privacy-policy.html';
                console.log(`개인정보처리방침 컴포넌트 경로: ${componentPath}`);
                break;
            case 'about-us':
                componentPath = 'components/about-us.html';
                console.log(`회사소개 컴포넌트 경로: ${componentPath}`);
                break;
            case 'contact-us':
                componentPath = 'components/contact-us.html';
                console.log(`문의하기 컴포넌트 경로: ${componentPath}`);
                break;
            case 'how-to-use':
                componentPath = 'components/how-to-use.html';
                console.log(`이용방법 컴포넌트 경로: ${componentPath}`);
                break;
            case 'faq':
                componentPath = 'components/faq.html';
                console.log(`자주 묻는 질문 컴포넌트 경로: ${componentPath}`);
                break;
            default: // 기본적으로 지도와 리스트 섹션만 표시
                console.log('기본 섹션 (지도와 리스트) 표시');
                mainPageContent.style.display = 'block'; // Ensure main content area is visible
                mainContentContainer.style.display = 'none'; // Hide dynamic content container

                // Explicitly show map, search, and list sections
                document.getElementById('map').classList.remove('hidden');
                document.getElementById('search').classList.remove('hidden');
                document.getElementById('list').classList.remove('hidden');

                // Initialize map and load storage list
                if (typeof initMap === 'function') {
                    initMap();
                }
                if (document.getElementById('list')) { // Check if list element exists before calling loadStorageList
                    loadStorageList();
                }
                return;
        }

        if (componentPath) {
            console.log('동적 컴포넌트 로드 시작');
            mainPageContent.style.display = 'none';
            mainContentContainer.style.display = 'block';
            await replaceComponent(mainContentContainer.id, componentPath);
        } else {
            console.log('정적 섹션 표시');
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
        loadPremiumStorages(); // 프리미엄 짐보관소 로드
        // 프리미엄 서비스 버튼에 이벤트 리스너 연결
        document.querySelectorAll('#premium .bg-yellow-500').forEach(button => {
            button.addEventListener('click', handlePremiumRequest);
        });
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

    // 프리미엄 서비스 요청 처리 함수
    async function handlePremiumRequest(event) {
        const button = event.target;
        const storageCard = button.closest('.bg-white.rounded-lg.shadow-lg');
        if (!storageCard) return;

        const storageName = storageCard.querySelector('h4').textContent;
        const userName = prompt('이름을 입력해주세요:');
        const userEmail = prompt('이메일을 입력해주세요:');

        if (!userName || !userEmail) {
            alert('이름과 이메일은 필수 입력 사항입니다.');
            return;
        }

        try {
            const response = await fetch('/api/premium-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ storageName, userName, userEmail }),
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
            } else {
                alert(`프리미엄 서비스 요청 실패: ${result.message}`);
            }
        } catch (error) {
            console.error('프리미엄 서비스 요청 중 오류 발생:', error);
            alert('프리미엄 서비스 요청 중 오류가 발생했습니다.');
        }
    }
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
                displaySearchResults(query);
            } else {
                resetSearchResults();
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

/**
 * 페이지의 메타 태그(title, description)를 동적으로 업데이트합니다.
 * @param {string} title - 새로운 페이지 제목
 * @param {string} description - 새로운 페이지 설명
 */
function updateMetaTags(title, description) {
    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', description);
    }
}

// 전역에서 접근 가능하도록 함수를 window 객체에 할당
window.updateMetaTags = updateMetaTags;