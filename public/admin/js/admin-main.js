document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const navLinks = document.querySelectorAll('.nav-link');

    // 페이지 로드 시 해시 값에 따라 콘텐츠 로드
    const loadContent = async (hash) => {
        // 활성 링크 스타일 업데이트
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });

        let url;
        switch (hash) {
            case '#storage-management':
                url = '/admin/components/storage-management.html';
                break;
            case '#report-management':
                url = '/admin/components/report-management.html';
                break;
            case '#dashboard':
            default:
                url = '/admin/components/dashboard.html';
                break;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('콘텐츠 로드 실패');
            mainContent.innerHTML = await response.text();

            // 컴포넌트별 JavaScript 로드 및 실행
            if (hash === '#report-management') {
                const script = document.createElement('script');
                script.src = '/admin/js/report-manager.js';
                script.onload = () => {
                    if (typeof loadReports === 'function') {
                        loadReports();
                    }
                };
                mainContent.appendChild(script);
            } else if (hash === '#storage-management') {
                const script = document.createElement('script');
                script.src = '/admin/js/storage-manager.js';
                script.onload = () => {
                    if (typeof initStorageManagement === 'function') {
                        initStorageManagement();
                    }
                };
                mainContent.appendChild(script);
            }

            // 대시보드인 경우 데이터 로드 함수 호출
            if (hash === '#dashboard' || hash === '') {
                loadDashboardData();
            }
        } catch (error) {
            mainContent.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    };

    // 대시보드 데이터 로드 및 표시
    const loadDashboardData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('대시보드 데이터를 불러오는 데 실패했습니다.');
            }

            const data = await response.json();
            document.getElementById('storageCount').textContent = data.storageCount;
            document.getElementById('reportCount').textContent = data.reportCount;
            document.getElementById('userCount').textContent = data.userCount;

        } catch (error) {
            console.error(error);
            // 오류 발생 시 대시보드 카드에 메시지 표시 가능
        }
    };

    // 네비게이션 링크 클릭 이벤트
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = e.target.getAttribute('href');
            window.location.hash = hash;
        });
    });

    // 해시 변경 감지
    window.addEventListener('hashchange', () => {
        loadContent(window.location.hash || '#dashboard');
    });

    // 초기 콘텐츠 로드
    loadContent(window.location.hash || '#dashboard');
});
