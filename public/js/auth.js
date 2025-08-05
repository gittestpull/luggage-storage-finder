/**
 * auth.js
 * 사용자 인증 및 로그인/로그아웃 기능을 담당합니다.
 */

// 인증 관련 기능 초기화
window.initAuthFeatures = function() {
    // 카카오 SDK 초기화 (실제 사용 시 앱 키로 변경 필요)
    Kakao.init('YOUR_KAKAO_APP_KEY');
    console.log('Kakao SDK 초기화 상태:', Kakao.isInitialized());

    // 카카오 로그인 버튼 이벤트 연결
    const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
    if (kakaoLoginBtn) {
        kakaoLoginBtn.addEventListener('click', kakaoLogin);
    }

    // 로그아웃 버튼 이벤트 연결
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // 일반 로그인 폼 이벤트 연결
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    }

    // 페이지 로드 시 로그인 상태 확인
    checkLoginStatus();

    // 회원가입 폼 이벤트 연결
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterFormSubmit);
    }

    // 회원가입/로그인 폼 전환
    const showRegisterFormBtn = document.getElementById('showRegisterForm');
    const showLoginFormBtn = document.getElementById('showLoginForm');
    const loginSection = document.getElementById('login');
    const registerSection = document.getElementById('register');

    if (showRegisterFormBtn && showLoginFormBtn && loginSection && registerSection) {
        showRegisterFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });

        showLoginFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        });
    }
}

// 회원가입 폼 제출 처리
async function handleRegisterFormSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!username || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '회원가입 실패');
        }

        alert('회원가입 성공! 이제 로그인해주세요.');
        // 회원가입 성공 후 로그인 폼으로 전환
        document.getElementById('register').classList.add('hidden');
        document.getElementById('login').classList.remove('hidden');
        document.getElementById('email').value = username; // 가입한 아이디 자동 입력

    } catch (error) {
        alert(error.message);
    }
}

// 카카오 로그인 함수
function kakaoLogin() {
    Kakao.Auth.login({
        success: function(authObj) {
            console.log('카카오 로그인 성공', authObj);
            
            // 사용자 정보 요청
            Kakao.API.request({
                url: '/v2/user/me',
                success: function(res) {
                    console.log('카카오 사용자 정보:', res);
                    
                    // 사용자 정보 저장 및 UI 업데이트
                    const kakaoAccount = res.kakao_account;
                    const profile = kakaoAccount.profile;
                    
                    // 로컬 스토리지에 사용자 정보 저장
                    localStorage.setItem('userToken', 'kakao_token'); // 임시 토큰
                    localStorage.setItem('userId', res.id); // 카카오 사용자 ID
                    localStorage.setItem('userNickname', profile.nickname);
                    localStorage.setItem('userProfileImage', profile.profile_image_url);
                    localStorage.setItem('userEmail', kakaoAccount.email || '');
                    localStorage.setItem('loginType', 'kakao');
                    localStorage.setItem('userPoints', 0); // 카카오 로그인 시 초기 포인트 0
                    
                    // UI 업데이트
                    updateLoginUI(true, profile.nickname, 0);
                    
                    // 로그인 섹션 숨김
                    const loginSection = document.getElementById('login');
                    if (loginSection) {
                        loginSection.classList.add('hidden');
                    }

                    // 사용자에게 알림
                    alert('카카오 로그인 성공! 환영합니다, ' + profile.nickname + '님.');
                },
                fail: function(error) {
                    console.error('카카오 사용자 정보 요청 실패', error);
                    alert('사용자 정보를 가져오는데 실패했습니다. 다시 시도해주세요.');
                }
            });
        },
        fail: function(err) {
            console.error('카카오 로그인 실패', err);
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    });
}

// 일반 로그인 폼 제출 처리
async function handleLoginFormSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '로그인 실패');
        }

        const { token, user } = await response.json();
        localStorage.setItem('userToken', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userNickname', user.username);
        localStorage.setItem('userPoints', user.points);
        localStorage.setItem('loginType', 'normal');
        
        updateLoginUI(true, user.username, user.points);
        
        const loginSection = document.getElementById('login');
        if (loginSection) {
            loginSection.classList.add('hidden');
        }

        alert('로그인 성공! 환영합니다, ' + user.username + '님.');

    } catch (error) {
        alert(error.message);
    }
}

// 로그아웃 함수
function logout() {
    const loginType = localStorage.getItem('loginType');
    
    if (loginType === 'kakao') {
        // 카카오 로그아웃
        if (Kakao.Auth.getAccessToken()) {
            Kakao.Auth.logout(function() {
                clearUserData();
                alert('로그아웃 되었습니다.');
            });
        } else {
            clearUserData();
            alert('로그아웃 되었습니다.');
        }
    } else {
        // 일반 로그아웃
        clearUserData();
        alert('로그아웃 되었습니다.');
    }
}

// 사용자 데이터 초기화
function clearUserData() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userProfileImage');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginType');
    localStorage.removeItem('userPoints');
    
    // UI 업데이트
    updateLoginUI(false);
    
    // 로그인 섹션 표시
    const loginSection = document.getElementById('login');
    if (loginSection) {
        loginSection.classList.remove('hidden');
    }
}

// 로그인 상태 확인
function checkLoginStatus() {
    const userToken = localStorage.getItem('userToken');
    const nickname = localStorage.getItem('userNickname');
    const points = localStorage.getItem('userPoints');
    
    updateLoginUI(!!userToken, nickname, points);
    
    if (!!userToken) {
        // 로그인 되어 있으면 로그인 섹션 숨김
        const loginSection = document.getElementById('login');
        if (loginSection) {
            loginSection.classList.add('hidden');
        }
    }
}

// UI 업데이트
function updateLoginUI(isLoggedIn, nickname = '', points = 0) {
    const loginLink = document.querySelector('a[href="#login"]');
    const userProfileArea = document.getElementById('userProfileArea');
    const userNickname = document.getElementById('userNickname');
    const userPoints = document.getElementById('userPoints');
    
    if (isLoggedIn) {
        // 로그인 된 상태
        if (loginLink) loginLink.classList.add('hidden');
        if (userProfileArea) {
            userProfileArea.classList.remove('hidden');
            if (userNickname) userNickname.textContent = nickname;
            if (userPoints) userPoints.querySelector('span').textContent = points.toLocaleString();
        }
    } else {
        // 로그아웃 상태
        if (loginLink) loginLink.classList.remove('hidden');
        if (userProfileArea) userProfileArea.classList.add('hidden');
    }
}