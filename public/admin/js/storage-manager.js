// 이 파일은 짐보관소 관리 페이지의 모든 DOM 조작과 이벤트 처리를 담당합니다.

document.addEventListener('DOMContentLoaded', () => {
    // admin-main.js에서 콘텐츠가 로드된 후 이벤트를 다시 설정해야 할 수 있으므로,
    // 전역에서 접근 가능한 함수로 만들거나 이벤트 위임을 사용합니다.
    initStorageManagement();
});

function initStorageManagement() {
    const storageListBody = document.getElementById('storage-list-body');
    const modal = document.getElementById('storageModal');
    const form = document.getElementById('storageForm');
    const addBtn = document.getElementById('addStorageBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (!storageListBody) return; // 해당 페이지가 아니면 실행 중지

    // 짐보관소 목록 로드
    const loadStorages = async () => {
        try {
            const storages = await fetchAllStoragesAdmin(); // admin-api.js에 정의될 함수
            storageListBody.innerHTML = ''; // 기존 목록 초기화
            if (storages.length === 0) {
                storageListBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">짐보관소가 없습니다.</td></tr>`;
                return;
            }
            storages.forEach(storage => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">${storage.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${storage.address}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${storage.status.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${storage.status.isOpen ? '개방중' : '마감'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(storage.createdAt).toLocaleDateString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 edit-btn" data-id="${storage._id}">수정</button>
                        <button class="text-red-600 hover:text-red-900 ml-4 delete-btn" data-id="${storage._id}">삭제</button>
                    </td>
                `;
                storageListBody.appendChild(row);
            });
        } catch (error) {
            storageListBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">데이터 로드 실패: ${error.message}</td></tr>`;
        }
    };

    // 모달 열기/닫기
    const openModal = (storage = null) => {
        form.reset();
        if (storage) {
            document.getElementById('modalTitle').textContent = '짐보관소 수정';
            document.getElementById('storageId').value = storage._id;
            document.getElementById('name').value = storage.name;
            document.getElementById('address').value = storage.address;
        } else {
            document.getElementById('modalTitle').textContent = '새 짐보관소 추가';
            document.getElementById('storageId').value = '';
        }
        modal.classList.remove('hidden');
    };
    const closeModal = () => modal.classList.add('hidden');

    // 이벤트 리스너 설정
    addBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('storageId').value;
        const data = {
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
            // 위도/경도 등 추가 정보 필요 시 여기에 추가
        };

        try {
            if (id) {
                await updateStorageAdmin(id, data); // admin-api.js
            } else {
                await createStorageAdmin(data); // admin-api.js
            }
            closeModal();
            loadStorages(); // 목록 새로고침
        } catch (error) {
            alert(`저장 실패: ${error.message}`);
        }
    });

    storageListBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('edit-btn')) {
            try {
                const storage = await fetchStorageByIdAdmin(id); // admin-api.js
                openModal(storage);
            } catch (error) {
                alert(`정보 불러오기 실패: ${error.message}`);
            }
        }
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('정말로 이 짐보관소를 삭제하시겠습니까?')) {
                try {
                    await deleteStorageAdmin(id); // admin-api.js
                    loadStorages(); // 목록 새로고침
                } catch (error) {
                    alert(`삭제 실패: ${error.message}`);
                }
            }
        }
    });

    // 초기 목록 로드
    loadStorages();
}
