document.addEventListener('componentReplaced', (e) => {
    if (e.detail.containerId === 'main-content' && e.detail.componentPath.includes('premium-management')) {
        loadPremiumStorages();
    }
});

async function loadPremiumStorages() {
    const storageList = document.getElementById('premium-storage-list');
    if (!storageList) return;

    try {
        const storages = await fetchAllAdminStorages(); // 모든 짐보관소 정보를 가져옵니다.
        storageList.innerHTML = ''; // 기존 목록을 비웁니다.

        storages.forEach(storage => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${storage.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${storage.address}</td>
                <td class="px-6 py-4 whitespace-nowrap">${storage.isPremium ? 'Yes' : 'No'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button class="text-blue-600 hover:underline toggle-premium-btn" data-id="${storage._id}" data-premium="${storage.isPremium}">
                        ${storage.isPremium ? '프리미엄 해제' : '프리미엄으로 지정'}
                    </button>
                </td>
            `;
            storageList.appendChild(row);
        });

        // 이벤트 리스너 추가
        document.querySelectorAll('.toggle-premium-btn').forEach(button => {
            button.addEventListener('click', handleTogglePremium);
        });

    } catch (error) {
        console.error('프리미엄 짐보관소 목록 로드 실패:', error);
        storageList.innerHTML = '<tr><td colspan="4" class="text-center py-4">목록을 불러오는 데 실패했습니다.</td></tr>';
    }
}

async function handleTogglePremium(event) {
    const button = event.target;
    const storageId = button.dataset.id;
    const isCurrentlyPremium = button.dataset.premium === 'true';

    if (!confirm(`정말로 이 짐보관소의 프리미엄 상태를 변경하시겠습니까?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/storages/${storageId}/premium`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ isPremium: !isCurrentlyPremium })
        });

        if (response.ok) {
            alert('프리미엄 상태가 성공적으로 변경되었습니다.');
            loadPremiumStorages(); // 목록 새로고침
        } else {
            const errorData = await response.json();
            alert(`상태 변경 실패: ${errorData.message}`);
        }
    } catch (error) {
        console.error('프리미엄 상태 변경 중 오류 발생:', error);
        alert('프리미엄 상태 변경 중 오류가 발생했습니다.');
    }
}

// 관리자용 모든 짐보관소 정보를 가져오는 함수 (admin-api.js에 있어야 할 수 있음)
async function fetchAllAdminStorages() {
    const response = await fetch('/api/admin/storages', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch storages');
    }
    return await response.json();
}
