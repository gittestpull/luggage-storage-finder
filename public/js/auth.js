/**
 * auth.js
 * 사용자 인증, 로그인/로그아웃, 회원가입 UX 개선 기능을 담당합니다.
 */

document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // 공통 초기화
    // ====================================================================
    initializeKakaoSDK();
    setupEventListeners();
    checkLoginStatus();

    // ====================================================================
    // 회원가입 UX 개선 로직
    // ====================================================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const emailInput = document.getElementById('registerEmail');
        const passwordInput = document.getElementById('registerPassword');
        const passwordConfirmInput = document.getElementById('registerPasswordConfirm');
        const registerButton = document.getElementById('registerButton');

        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const passwordConfirmError = document.getElementById('passwordConfirmError');

        const togglePassword = document.getElementById('togglePassword');
        const togglePasswordConfirm = document.getElementById('togglePasswordConfirm');

        // 유효성 검사 함수
        const validators = {
            email: (value) => {
                if (!value) return "이메일을 입력해주세요.";
                if (!/^\S+@\S+\.\S+$/.test(value)) return "올바른 이메일 형식이 아닙니다.";
                return "";
            },
            password: (value) => {
                if (!value) return "비밀번호를 입력해주세요.";
                if (value.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
                if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(value)) return "영문, 숫자, 특수문자를 모두 포함해야 합니다.";
                return "";
            },
            passwordConfirm: (value, password) => {
                if (!value) return "비밀번호를 다시 입력해주세요.";
                if (value !== password) return "비밀번호가 일치하지 않습니다.";
                return "";
            }
        };

        // 유효성 상태 객체
        let validationState = { email: false, password: false, passwordConfirm: false };

        // 유효성 검사 및 UI 업데이트 함수
        function validateField(field, value, value2) {
            const errorElement = document.getElementById(`${field}Error`);
            const errorMessage = validators[field](value, value2);
            if (errorMessage) {
                errorElement.textContent = errorMessage;
                errorElement.classList.remove('hidden');
                validationState[field] = false;
            } else {
                errorElement.classList.add('hidden');
                validationState[field] = true;
            }
            updateRegisterButtonState();
        }

        // 회원가입 버튼 상태 업데이트
        function updateRegisterButtonState() {
            const allValid = Object.values(validationState).every(Boolean);
            registerButton.disabled = !allValid;
            registerButton.classList.toggle('opacity-50', !allValid);
            registerButton.classList.toggle('cursor-not-allowed', !allValid);
        }

        // 이벤트 리스너 연결
        emailInput.addEventListener('input', () => validateField('email', emailInput.value));
        passwordInput.addEventListener('input', () => {
            validateField('password', passwordInput.value);
            validateField('passwordConfirm', passwordConfirmInput.value, passwordInput.value);
        });
        passwordConfirmInput.addEventListener('input', () => validateField('passwordConfirm', passwordConfirmInput.value, passwordInput.value));

        // 비밀번호 보이기/숨기기
        togglePassword.addEventListener('click', () => togglePasswordVisibility(passwordInput));
        togglePasswordConfirm.addEventListener('click', () => togglePasswordVisibility(passwordConfirmInput));

        // 초기 버튼 상태 설정
        updateRegisterButtonState();
    }
});

function initializeKakaoSDK() {
    try {
        if (Kakao && !Kakao.isInitialized()) {
            Kakao.init('YOUR_KAKAO_APP_KEY');
        }
    } catch (e) {
        console.error("Kakao SDK 초기화 실패:", e);
    }
}

function setupEventListeners() {
    console.log('setupEventListeners 함수 시작');
    // 로그인/회원가입 폼 전환
    const showRegisterFormBtn = document.getElementById('showRegisterForm');
    const showLoginFormBtn = document.getElementById('showLoginForm');
    const loginSection = document.getElementById('login');
    const registerSection = document.getElementById('register');

    if (showRegisterFormBtn && loginSection && registerSection) {
        showRegisterFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });
    }

    if (showLoginFormBtn && loginSection && registerSection) {
        showLoginFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        });
    }

    // 폼 제출 이벤트
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    }
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterFormSubmit);
    }

    // 로그아웃 버튼
    document.getElementById('logoutButton')?.addEventListener('click', logout);
    document.getElementById('mobileLogoutButton')?.addEventListener('click', logout);
    
    // 카카오 로그인 버튼
    document.getElementById('kakaoLoginBtn')?.addEventListener('click', kakaoLogin);
}

// 전역에서 접근 가능하도록 함수를 window 객체에 할당
window.setupEventListeners = setupEventListeners;

function togglePasswordVisibility(inputElement) {
    if (inputElement.type === 'password') {
        inputElement.type = 'text';
    } else {
        inputElement.type = 'password';
    }
}

async function handleRegisterFormSubmit(e) {
    e.preventDefault();
    const registerButton = document.getElementById('registerButton');
    const btnText = registerButton.querySelector('.btn-text');
    const spinner = registerButton.querySelector('.spinner');

    // 로딩 상태 시작
    registerButton.disabled = true;
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');

    const username = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || '회원가입 중 오류가 발생했습니다.');
        }

        alert('회원가입 성공! 이제 로그인해주세요.');
        document.getElementById('register').classList.add('hidden');
        document.getElementById('login').classList.remove('hidden');
        document.getElementById('email').value = username;
        document.getElementById('registerForm').reset();

    } catch (error) {
        alert(error.message);
    } finally {
        // 로딩 상태 종료
        registerButton.disabled = false;
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// 이하 로그인, 로그아웃, 상태 확인 등 나머지 함수들은 기존과 거의 동일
// (단, 에러 핸들링 및 UI 업데이트 로직이 일부 개선될 수 있음)

// 카카오 로그인 함수
function kakaoLogin() {
    if (!Kakao || !Kakao.isInitialized()) {
        alert('카카오 로그인을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    Kakao.Auth.login({
        success: function(authObj) {
            Kakao.API.request({
                url: '/v2/user/me',
                success: async function(res) {
                    const { id, kakao_account } = res;
                    const { profile, email } = kakao_account;
                    localStorage.setItem('userToken', authObj.access_token);
                    localStorage.setItem('userId', id);
                    localStorage.setItem('userNickname', profile.nickname);
                    localStorage.setItem('userEmail', email || '');
                    localStorage.setItem('loginType', 'kakao');
                    // 최신 사용자 정보 가져와서 UI 업데이트
                    try {
                        const updatedUser = await fetchCurrentUserProfile();
                        localStorage.setItem('userPoints', updatedUser.points);
                        localStorage.setItem('userSubmittedReportPoints', updatedUser.submittedReportPoints);
                        localStorage.setItem('userApprovedReportPoints', updatedUser.approvedReportPoints);
                        updateLoginUI(true, updatedUser.username, updatedUser.points, updatedUser.submittedReportPoints, updatedUser.approvedReportPoints);
                    } catch (profileError) {
                        console.error('카카오 로그인 후 사용자 프로필 업데이트 실패:', profileError);
                        // 오류 발생 시 기존 로직으로 대체 (총 포인트만 표시)
                        updateLoginUI(true, profile.nickname, 0, 0, 0);
                    }
                    document.getElementById('login').classList.add('hidden');
                    alert(`환영합니다, ${profile.nickname}님!`);
                },
                fail: function(error) {
                    alert('사용자 정보 요청에 실패했습니다.');
                    console.error(error);
                }
            });
        },
        fail: function(err) {
            alert('카카오 로그인에 실패했습니다.');
            console.error(err);
        }
    });
}

// 일반 로그인 폼 제출 처리
async function handleLoginFormSubmit(e) {
    e.preventDefault(); // Keep this, as it's called by the delegated handler
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

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || '로그인 실패');
        }

        const { token, user } = result;
        localStorage.setItem('userToken', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userNickname', user.username);
        localStorage.setItem('loginType', 'normal');
        
        // 최신 사용자 정보 가져와서 UI 업데이트
        try {
            const updatedUser = await fetchCurrentUserProfile();
            localStorage.setItem('userPoints', updatedUser.points);
            localStorage.setItem('userSubmittedReportPoints', updatedUser.submittedReportPoints);
            localStorage.setItem('userApprovedReportPoints', updatedUser.approvedReportPoints);
            updateLoginUI(true, updatedUser.username, updatedUser.points, updatedUser.submittedReportPoints, updatedUser.approvedReportPoints);
        } catch (profileError) {
            console.error('로그인 후 사용자 프로필 업데이트 실패:', profileError);
            // 오류 발생 시 기존 로직으로 대체 (총 포인트만 표시)
            updateLoginUI(true, user.username, user.points, 0, 0);
        }
        document.getElementById('login').classList.add('hidden');
        alert(`환영합니다, ${user.username}님!`);

    } catch (error) {
        alert(error.message);
    }
}

// 로그아웃 함수
function logout() {
    const loginType = localStorage.getItem('loginType');
    
    if (loginType === 'kakao' && Kakao.Auth.getAccessToken()) {
        Kakao.Auth.logout(() => {
            clearUserData();
            alert('로그아웃 되었습니다.');
        });
    } else {
        clearUserData();
        alert('로그아웃 되었습니다.');
    }
}

// 사용자 데이터 초기화
function clearUserData() {
    localStorage.clear();
    updateLoginUI(false);
    document.getElementById('login').classList.remove('hidden');
}

// 로그인 상태 확인
async function checkLoginStatus() {
    const userToken = localStorage.getItem('userToken');

    if (userToken) {
        try {
            const updatedUser = await fetchCurrentUserProfile();
            if (updatedUser) {
                // User is authenticated, update UI and localStorage
                localStorage.setItem('userPoints', updatedUser.points);
                localStorage.setItem('userSubmittedReportPoints', updatedUser.submittedReportPoints);
                localStorage.setItem('userApprovedReportPoints', updatedUser.approvedReportPoints);
                localStorage.setItem('userNickname', updatedUser.username);
                localStorage.setItem('userId', updatedUser._id);

                updateLoginUI(true, updatedUser.username, updatedUser.points, updatedUser.submittedReportPoints, updatedUser.approvedReportPoints);
                document.getElementById('login').classList.add('hidden');
            } else {
                // Token is invalid or expired, clear it silently
                clearUserData();
            }
        } catch (error) {
            console.error('로그인 상태 확인 중 오류 발생:', error);
            // On other errors (e.g. network), treat as logged out.
            updateLoginUI(false);
        }
    } else {
        updateLoginUI(false);
    }
}

// UI 업데이트
function updateLoginUI(isLoggedIn, nickname = '', totalPoints = 0, submittedPoints = 0, approvedPoints = 0) {
    const loginLink = document.querySelector('a[href="#login"]');
    const userProfileArea = document.getElementById('userProfileArea');
    const userNickname = document.getElementById('userNickname');
    const userPoints = document.getElementById('userPoints');
    const userSubmittedPoints = document.getElementById('userSubmittedPoints');
    const userApprovedPoints = document.getElementById('userApprovedPoints');

    const mobileUserProfileArea = document.getElementById('mobileUserProfileArea');
    const mobileUserNickname = document.getElementById('mobileUserNickname');
    const mobileUserPoints = document.getElementById('mobileUserPoints');
    const mobileUserSubmittedPoints = document.getElementById('mobileUserSubmittedPoints');
    const mobileUserApprovedPoints = document.getElementById('mobileUserApprovedPoints');
    
    if (isLoggedIn) {
        loginLink?.parentElement.classList.add('hidden');
        userProfileArea?.classList.remove('hidden');
        mobileUserProfileArea?.classList.remove('hidden');

        if(userNickname) userNickname.textContent = nickname;
        if(userPoints) userPoints.querySelector('span').textContent = totalPoints?.toLocaleString() || 0;
        if(userSubmittedPoints) userSubmittedPoints.querySelector('span').textContent = submittedPoints?.toLocaleString() || 0;
        if(userApprovedPoints) userApprovedPoints.querySelector('span').textContent = approvedPoints?.toLocaleString() || 0;

        if(mobileUserNickname) mobileUserNickname.textContent = nickname;
        if(mobileUserPoints) mobileUserPoints.querySelector('span').textContent = totalPoints?.toLocaleString() || 0;
        if(mobileUserSubmittedPoints) mobileUserSubmittedPoints.querySelector('span').textContent = submittedPoints?.toLocaleString() || 0;
        if(mobileUserApprovedPoints) mobileUserApprovedPoints.querySelector('span').textContent = approvedPoints?.toLocaleString() || 0;

    } else {
        loginLink?.parentElement.classList.remove('hidden');
        userProfileArea?.classList.add('hidden');
        mobileUserProfileArea?.classList.add('hidden');
    }
}