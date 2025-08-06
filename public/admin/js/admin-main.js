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
            case '#user-management':
                url = '/admin/components/user-management.html';
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
            } else if (hash === '#user-management') {
                const script = document.createElement('script');
                script.src = '/admin/js/user-manager.js';
                script.onload = () => {
                    if (typeof initUserManagement === 'function') {
                        initUserManagement();
                    }
                };
                mainContent.appendChild(script);
            }

            // 대시보드인 경우 데이터 로드 함수 호출
            if (hash === '#dashboard' || hash === '') {
                loadDashboardData();
                // 재시작 버튼 이벤트 리스너 추가
                const restartButton = document.getElementById('restartAppBtn');
                if (restartButton) {
                    restartButton.addEventListener('click', async () => {
                        if (confirm('정말로 애플리케이션을 재시작하시겠습니까? 이 작업은 잠시 서비스 중단을 초래할 수 있습니다.')) {
                            try {
                                alert('애플리케이션 재시작 명령을 보냈습니다. 잠시 후 서비스가 재시작됩니다.');
                                await restartApplicationAdmin(); // admin-api.js에 정의된 함수
                                // 재시작 후 페이지 새로고침 (선택 사항, 서비스 중단 후 복구 확인용)
                                setTimeout(() => {
                                    window.location.reload();
                                }, 5000); // 5초 후 새로고침
                            } catch (error) {
                                console.error('애플리케이션 재시작 실패:', error);
                                alert(`애플리케이션 재시작 실패: ${error.message}`);
                            }
                        }
                    });
                }
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
            document.getElementById('regularUserCount').textContent = data.regularUserCount;
            document.getElementById('adminUserCount').textContent = data.adminUserCount;

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
