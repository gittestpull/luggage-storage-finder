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
            case '#premium-management':
                url = '/admin/components/premium-management.html';
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
            } else if (hash === '#premium-management') {
                const script = document.createElement('script');
                script.src = '/admin/js/premium-manager.js';
                script.onload = () => {
                    if (typeof loadPremiumStorages === 'function') {
                        loadPremiumStorages();
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
            document.getElementById('regularUserCount').textContent = data.regularUserCount;
            document.getElementById('adminUserCount').textContent = data.adminUserCount;

            const recentActivitiesList = document.getElementById('recentActivitiesList');
            if (recentActivitiesList) {
                recentActivitiesList.innerHTML = '';
                if (data.recentActivities && data.recentActivities.length > 0) {
                    data.recentActivities.forEach(activity => {
                        const li = document.createElement('li');
                        li.className = 'py-3 flex justify-between items-center';
                        let activityText = '';
                        if (activity.username) { // User registration
                            activityText = `<strong>${activity.username}</strong>님이 가입했습니다.`;
                        } else { // Report
                            activityText = `<strong>${activity.reportedBy.username}</strong>님이 <strong>${activity.name}</strong>을(를) 제보했습니다.`;
                        }
                        li.innerHTML = `<span class="text-gray-700">${activityText}</span><span class="text-sm text-gray-500">${new Date(activity.createdAt).toLocaleString()}</span>`;
                        recentActivitiesList.appendChild(li);
                    });
                } else {
                    recentActivitiesList.innerHTML = '<li class="text-center py-4 text-gray-500">최근 활동이 없습니다.</li>';
                }
            }

            const reportChartCanvas = document.getElementById('reportChart');
            if (reportChartCanvas && data.reportStats) {
                new Chart(reportChartCanvas, {
                    type: 'bar',
                    data: {
                        labels: data.reportStats.map(stat => stat.username),
                        datasets: [{
                            label: '제보 횟수',
                            data: data.reportStats.map(stat => stat.count),
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }

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
