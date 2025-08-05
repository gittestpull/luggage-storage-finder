/**
 * auth.js
 * 사용자 인증 및 로그인/로그아웃 기능을 담당합니다.
 */

// 페이지 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 컴포넌트가 모두 로드된 후 이벤트 연결
    window.addEventListener('componentsLoaded', initAuthFeatures);
});

// 인증 관련 기능 초기화
function initAuthFeatures() {
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
                    localStorage.setItem('userLoggedIn', 'true');
                    localStorage.setItem('userNickname', profile.nickname);
                    localStorage.setItem('userProfileImage', profile.profile_image_url);
                    localStorage.setItem('userEmail', kakaoAccount.email || '');
                    localStorage.setItem('loginType', 'kakao');
                    
                    // UI 업데이트
                    updateLoginUI(true, profile.nickname);
                    
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
function handleLoginFormSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // 간단한 유효성 검사
    if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }
    
    // 실제 환경에서는 서버 API 호출
    // 여기서는 테스트를 위해 로컬 스토리지에 정보 저장
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('userNickname', '사용자');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('loginType', 'normal');
    
    // UI 업데이트
    updateLoginUI(true, '사용자');
    
    // 로그인 섹션 숨김
    const loginSection = document.getElementById('login');
    if (loginSection) {
        loginSection.classList.add('hidden');
    }
    
    // 폼 초기화
    e.target.reset();
    
    // 사용자에게 알림
    alert('로그인 성공! 환영합니다.');
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
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userProfileImage');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginType');
    
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
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const nickname = localStorage.getItem('userNickname');
    
    updateLoginUI(isLoggedIn, nickname);
    
    if (isLoggedIn) {
        // 로그인 되어 있으면 로그인 섹션 숨김
        const loginSection = document.getElementById('login');
        if (loginSection) {
            loginSection.classList.add('hidden');
        }
    }
}

// UI 업데이트
function updateLoginUI(isLoggedIn, nickname = '') {
    const loginLink = document.querySelector('a[href="#login"]');
    const userProfileArea = document.getElementById('userProfileArea');
    const userNickname = document.getElementById('userNickname');
    
    if (isLoggedIn) {
        // 로그인 된 상태
        if (loginLink) loginLink.classList.add('hidden');
        if (userProfileArea) {
            userProfileArea.classList.remove('hidden');
            if (userNickname) userNickname.textContent = nickname;
        }
    } else {
        // 로그아웃 상태
        if (loginLink) loginLink.classList.remove('hidden');
        if (userProfileArea) userProfileArea.classList.add('hidden');
    }
}