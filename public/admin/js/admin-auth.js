document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '로그인 실패');
                }

                const { token } = await response.json();
                localStorage.setItem('adminToken', token);
                window.location.href = '/admin/index.html';

            } catch (error) {
                alert(error.message);
            }
        });
    }

    // 메인 페이지의 로그아웃 버튼 처리
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
        });
    }
});

// 페이지 접근 제어
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    // 로그인 페이지가 아닌데 토큰이 없으면 로그인 페이지로 리디렉션
    if (!token && !window.location.pathname.endsWith('login.html')) {
        window.location.href = '/admin/login.html';
    }
    // 로그인 페이지인데 토큰이 있으면 메인 페이지로 리디렉션
    if (token && window.location.pathname.endsWith('login.html')) {
        window.location.href = '/admin/index.html';
    }
}

// 페이지 로드 시 인증 상태 확인
checkAuth();
