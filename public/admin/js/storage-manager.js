// 이 파일은 짐보관소 관리 페이지의 모든 DOM 조작과 이벤트 처리를 담당합니다.

// admin-main.js에서 콘텐츠가 로드된 후 이벤트를 다시 설정해야 할 수 있으므로,
// 전역에서 접근 가능한 함수로 만들거나 이벤트 위임을 사용합니다.
// initStorageManagement(); // admin-main.js에서 직접 호출

function initStorageManagement() {
    console.log('initStorageManagement function executed - Version 2.0');
    console.log('initStorageManagement 함수 실행됨');
    const storageListBody = document.getElementById('storage-list-body');
    const modal = document.getElementById('storageModal');
    const form = document.getElementById('storageForm');
    const addBtn = document.getElementById('addStorageBtn');

    if (!storageListBody) return; // 해당 페이지가 아니면 실행 중지

    // 짐보관소 목록 로드
    const loadStorages = async () => {
        try {
            const storages = await fetchAllStoragesAdmin(); // admin-api.js에 정의될 함수
            storageListBody.innerHTML = ''; // 기존 목록 초기화
            if (storages.length === 0) {
                storageListBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">짐보관소가 없습니다.</td></tr>`;
                return;
            }
            storages.forEach(storage => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" class="storage-select-checkbox form-checkbox h-4 w-4 text-blue-600" data-id="${storage._id}">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${storage.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${storage.address}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <select class="status-select bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" data-id="${storage._id}">
                            <option value="true" ${storage.status.isOpen ? 'selected' : ''}>개방중</option>
                            <option value="false" ${!storage.status.isOpen ? 'selected' : ''}>마감</option>
                        </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(storage.createdAt).toLocaleString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 edit-btn" data-id="${storage._id}">수정</button>
                        <button class="text-red-600 hover:text-red-900 ml-4 delete-btn" data-id="${storage._id}">삭제</button>
                    </td>
                `;
                storageListBody.appendChild(row);
            });

            // 전체 선택/해제 체크박스 이벤트 리스너
            const selectAllStoragesCheckbox = document.getElementById('selectAllStorages');
            if (selectAllStoragesCheckbox) {
                selectAllStoragesCheckbox.checked = false; // 초기화
                selectAllStoragesCheckbox.addEventListener('change', (e) => {
                    document.querySelectorAll('.storage-select-checkbox').forEach(checkbox => {
                        checkbox.checked = e.target.checked;
                    });
                });
            }

            // 일괄 상태 변경 버튼 이벤트 리스너
            const applyBulkStatusBtn = document.getElementById('applyBulkStatusBtn');
            const bulkStatusSelect = document.getElementById('bulkStatusSelect');
            if (applyBulkStatusBtn && bulkStatusSelect) {
                applyBulkStatusBtn.addEventListener('click', async () => {
                    const selectedIds = Array.from(document.querySelectorAll('.storage-select-checkbox:checked'))
                                            .map(checkbox => checkbox.dataset.id);
                    const newStatus = bulkStatusSelect.value;

                    if (selectedIds.length === 0) {
                        alert('상태를 변경할 짐보관소를 선택해주세요.');
                        return;
                    }
                    if (!newStatus) {
                        alert('변경할 상태를 선택해주세요.');
                        return;
                    }

                    if (confirm(`${selectedIds.length}개의 짐보관소 상태를 '${newStatus === 'true' ? '개방중' : '마감'}'으로 변경하시겠습니까?`)) {
                        try {
                            await bulkUpdateStorageStatusAdmin(selectedIds, newStatus === 'true');
                            alert('선택된 짐보관소의 상태가 성공적으로 업데이트되었습니다.');
                            loadStorages(); // 목록 새로고침
                        } catch (error) {
                            alert(`일괄 상태 업데이트 실패: ${error.message}`);
                        }
                    }
                });
            }
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

    // 상태 변경 드롭다운 이벤트 리스너 (이벤트 위임)
    storageListBody.addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-select')) {
            const id = e.target.dataset.id;
            const isOpen = e.target.value === 'true';
            try {
                await updateStorageStatusAdmin(id, isOpen);
                alert('상태가 성공적으로 업데이트되었습니다.');
                loadStorages(); // 목록 새로고침
            } catch (error) {
                alert(`상태 업데이트 실패: ${error.message}`);
            }
        }
    });

    // 초기 목록 로드
    loadStorages();
}
