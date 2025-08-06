// 사용자 목록 로드 함수
async function loadUsers() {
    console.log('loadUsers 함수 호출됨.');
    try {
        console.log('fetchAllUsersAdmin 함수 호출 시도...');
        const users = await fetchAllUsersAdmin();
        console.log('fetchAllUsersAdmin 응답:', users);
        const usersTableBody = document.querySelector('#usersTable tbody');
        usersTableBody.innerHTML = '';

        if (users && users.length > 0) {
            console.log(`${users.length}명의 사용자 데이터 발견. 테이블 렌더링 시작.`);
            users.forEach(user => {
                console.log('사용자 렌더링:', user.username);
                const row = usersTableBody.insertRow();
                row.insertCell().textContent = user._id;
                row.insertCell().textContent = user.username;
                row.insertCell().textContent = user.email || '';
                row.insertCell().textContent = new Date(user.createdAt).toLocaleString();
                row.insertCell().textContent = user.points || 0;
                row.insertCell().textContent = user.isAdmin ? '예' : '아니오';

                const actionsCell = row.insertCell();
                const editButton = document.createElement('button');
                editButton.textContent = '수정';
                editButton.className = 'btn btn-sm btn-info mr-2';
                editButton.onclick = () => openUserModal(user);
                actionsCell.appendChild(editButton);

                
            });
        } else {
            console.log('사용자 데이터가 없거나 비어 있습니다.');
            const row = usersTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7; // 모든 컬럼을 커버하도록 설정
            cell.textContent = '등록된 사용자가 없습니다.';
            cell.className = 'text-center py-4 text-gray-500';
        }
    } catch (error) {
        console.error('사용자 데이터를 불러오는 데 실패했습니다:', error);
        alert('사용자 데이터를 불러오는 데 실패했습니다.');
    }
}

// 사용자 모달 열기 함수
function openUserModal(user = null) {
    const userModalElement = document.getElementById('userModal');
    console.log('openUserModal called. userModalElement:', userModalElement);

    if (!userModalElement) {
        console.error('Error: userModal element not found in DOM. Cannot open modal.');
        alert('모달을 여는 데 문제가 발생했습니다. 페이지를 새로고침해 주세요.');
        return;
    }

    try {
        const modal = new bootstrap.Modal(userModalElement);
        const form = document.getElementById('userForm');
        form.reset(); // 폼 초기화

        if (user) {
            document.getElementById('userModalLabel').textContent = '사용자 수정';
            document.getElementById('userId').value = user._id;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email || '';
            document.getElementById('points').value = user.points || 0;
            document.getElementById('isAdmin').checked = user.isAdmin;
            document.getElementById('password').removeAttribute('required'); // 수정 시 비밀번호 필수는 아님
        } else {
            document.getElementById('userModalLabel').textContent = '새 사용자 추가';
            document.getElementById('userId').value = '';
            document.getElementById('password').setAttribute('required', 'required'); // 추가 시 비밀번호 필수
        }
        modal.show();
    } catch (e) {
        console.error('Error initializing Bootstrap modal:', e);
        alert('모달 초기화 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.');
    }
}

// 사용자 저장 (생성/수정) 함수
// 이 이벤트 리스너는 initUserManagement 함수 내에서 설정됩니다.

// 사용자 삭제 함수
async function deleteUser(id) {
    if (confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
        try {
            await deleteUserAdmin(id);
            alert('사용자가 성공적으로 삭제되었습니다.');
            loadUsers(); // 목록 새로고침
        } catch (error) {
            console.error('사용자 삭제 실패:', error);
            alert(`사용자 삭제 실패: ${error.message}`);
        }
    }
}

// admin-main.js에서 이 컴포넌트를 로드할 때 호출될 함수
window.initUserManagement = () => {
    console.log('initUserManagement 호출됨.');
    loadUsers();

    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserModal());
    } else {
        console.warn('addUserBtn을 찾을 수 없습니다.');
    }

    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userId = document.getElementById('userId').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const email = document.getElementById('email').value;
            const points = parseInt(document.getElementById('points').value);
            const isAdmin = document.getElementById('isAdmin').checked;

            const userData = { username, email, points, isAdmin };
            if (password) {
                userData.password = password;
            }

            try {
                if (userId) {
                    await updateUserAdmin(userId, userData);
                    alert('사용자가 성공적으로 업데이트되었습니다.');
                } else {
                    await createUserAdmin(userData);
                    alert('사용자가 성공적으로 생성되었습니다.');
                }
                bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
                loadUsers(); // 목록 새로고침
            } catch (error) {
                console.error('사용자 저장 실패:', error);
                alert(`사용자 저장 실패: ${error.message}`);
            }
        });
    } else {
        console.warn('userForm을 찾을 수 없습니다.');
    }
};