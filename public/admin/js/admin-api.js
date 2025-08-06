const API_HEADERS = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

// 모든 짐보관소 목록 가져오기 (관리자용)
async function fetchAllStoragesAdmin() {
    const response = await fetch('/api/admin/storages', { headers: API_HEADERS() });
    if (!response.ok) throw new Error('데이터를 불러오지 못했습니다.');
    return await response.json();
}

// ID로 특정 짐보관소 정보 가져오기 (관리자용)
async function fetchStorageByIdAdmin(id) {
    const response = await fetch(`/api/storages/${id}`, { headers: API_HEADERS() });
    if (!response.ok) throw new Error('데이터를 불러오지 못했습니다.');
    return await response.json();
}

// 새 짐보관소 생성 (관리자용)
async function createStorageAdmin(data) {
    const response = await fetch('/api/storages', {
        method: 'POST',
        headers: API_HEADERS(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '생성 실패');
    }
    return await response.json();
}

// 짐보관소 정보 업데이트 (관리자용)
async function updateStorageAdmin(id, data) {
    const response = await fetch(`/api/storages/${id}`, {
        method: 'PUT',
        headers: API_HEADERS(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '업데이트 실패');
    }
    return await response.json();
}

// 짐보관소 삭제 (관리자용)
async function deleteStorageAdmin(id) {
    const response = await fetch(`/api/storages/${id}`, {
        method: 'DELETE',
        headers: API_HEADERS()
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '삭제 실패');
    }
    return await response.json();
}

// --- 관리자용 제보 관리 API ---

// 모든 제보 목록 가져오기
async function fetchAllReportsAdmin() {
    const response = await fetch('/api/admin/reports', { headers: API_HEADERS() });
    if (!response.ok) throw new Error('제보 데이터를 불러오지 못했습니다.');
    return await response.json();
}

// 제보 상태 업데이트
async function updateReportStatusAdmin(id, status) {
    const response = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: API_HEADERS(),
        body: JSON.stringify({ status })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '상태 업데이트 실패');
    }
    return await response.json();
}

// 짐보관소 상태 업데이트 (관리자용)
async function updateStorageStatusAdmin(id, isOpen) {
    const response = await fetch(`/api/admin/storages/${id}/status`, {
        method: 'PATCH',
        headers: API_HEADERS(),
        body: JSON.stringify({ isOpen })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '짐보관소 상태 업데이트 실패');
    }
    return await response.json();
}

// 여러 짐보관소 상태 일괄 업데이트 (관리자용)
async function bulkUpdateStorageStatusAdmin(ids, isOpen) {
    const response = await fetch('/api/admin/storages/bulk-status', {
        method: 'PATCH',
        headers: API_HEADERS(),
        body: JSON.stringify({ ids, isOpen })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '짐보관소 일괄 상태 업데이트 실패');
    }
    return await response.json();
}

// 모든 사용자 목록 가져오기 (관리자용)
async function fetchAllUsersAdmin() {
    const response = await fetch('/api/admin/users', { headers: API_HEADERS() });
    if (!response.ok) throw new Error('사용자 데이터를 불러오지 못했습니다.');
    return await response.json();
}

// 새 사용자 생성 (관리자용)
async function createUserAdmin(data) {
    const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: API_HEADERS(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 생성 실패');
    }
    return await response.json();
}

// 사용자 정보 업데이트 (관리자용)
async function updateUserAdmin(id, data) {
    const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: API_HEADERS(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 업데이트 실패');
    }
    return await response.json();
}

// 사용자 삭제 (관리자용)
async function deleteUserAdmin(id) {
    const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: API_HEADERS()
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 삭제 실패');
    }
    return await response.json();
}

// 애플리케이션 재시작 (관리자용)
async function restartApplicationAdmin() {
    const response = await fetch('/api/admin/system/restart', {
        method: 'POST',
        headers: API_HEADERS()
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '애플리케이션 재시작 실패');
    }
    return await response.json();
}
