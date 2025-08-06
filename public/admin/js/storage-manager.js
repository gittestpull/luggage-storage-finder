// 이 파일은 짐보관소 관리 페이지의 모든 DOM 조작과 이벤트 처리를 담당합니다.

// 전역 변수 선언
let isInitialized = false;
let currentStorages = []; // 현재 로드된 짐보관소 데이터 캐시

// 관리자 페이지 진입점 함수
function initStorageManagement() {
    console.log('initStorageManagement 함수 실행 - Version 3.0');
    
    // DOM 요소 참조
    const storageListBody = document.getElementById('storage-list-body');
    const modal = document.getElementById('storageModal');
    const form = document.getElementById('storageForm');
    const addBtn = document.getElementById('addStorageBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const searchInput = document.getElementById('storageSearchInput');
    
    // 필수 요소가 없으면 실행 중지
    if (!storageListBody) {
        console.error('storage-list-body 요소를 찾을 수 없습니다!');
        return;
    }
    
    // 데이터 로드 및 테이블 렌더링 함수
    async function loadStorages() {
        try {
            console.log('loadStorages 함수 실행 - 짐보관소 데이터 로딩 시작');
            storageListBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">데이터를 불러오는 중...</td></tr>';
            
            const storages = await fetchAllStoragesAdmin(); // admin-api.js에 정의된 함수
            console.log(`${storages?.length || 0}개의 짐보관소 데이터 로드됨`);
            
            // 데이터 캐싱
            currentStorages = storages || [];
            
            // 테이블 렌더링
            renderStorageTable(currentStorages);
            
        } catch (error) {
            console.error('데이터 로드 중 오류 발생:', error);
            storageListBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">데이터 로드 중 오류가 발생했습니다: ${error.message}</td></tr>`;
        }
    }
    
    // 테이블 렌더링 함수 - 검색 필터링에도 사용
    function renderStorageTable(storages) {
        if (!storageListBody) return;
        
        storageListBody.innerHTML = ''; // 기존 목록 초기화
        
        if (!storages || storages.length === 0) {
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
                <td class="px-6 py-4 whitespace-nowrap">${storage.location ? storage.location.coordinates[1] : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${storage.location ? storage.location.coordinates[0] : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select class="status-select bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" data-id="${storage._id}">
                        <option value="true" ${storage.status && storage.status.isOpen ? 'selected' : ''}>개방중</option>
                        <option value="false" ${!storage.status || !storage.status.isOpen ? 'selected' : ''}>마감</option>
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
    }
    
    // 검색 기능 설정
    function setupSearch() {
        if (searchInput) {
            // 기존 이벤트 리스너 제거
            searchInput.removeEventListener('input', handleSearch);
            // 새 이벤트 리스너 추가
            searchInput.addEventListener('input', handleSearch);
            console.log('검색 이벤트 리스너 설정 완료');
        } else {
            console.warn('storageSearchInput 요소를 찾을 수 없습니다!');
        }
    }
    
    // 검색 처리 함수
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        console.log(`검색어: "${searchTerm}"`);
        
        if (!searchTerm) {
            // 검색어가 없으면 전체 목록 표시
            renderStorageTable(currentStorages);
            return;
        }
        
        // 검색어로 필터링
        const filteredStorages = currentStorages.filter(storage => 
            storage.name.toLowerCase().includes(searchTerm) || 
            storage.address.toLowerCase().includes(searchTerm)
        );
        
        console.log(`검색 결과: ${filteredStorages.length}개 항목 일치`);
        renderStorageTable(filteredStorages);
    }
    
    // 일괄 상태 변경 기능 설정
    function setupBulkActions() {
        const selectAllCheckbox = document.getElementById('selectAllStorages');
        const applyBulkStatusBtn = document.getElementById('applyBulkStatusBtn');
        const bulkStatusSelect = document.getElementById('bulkStatusSelect');
        
        // 전체 선택/해제 체크박스
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false; // 초기화
            selectAllCheckbox.removeEventListener('change', handleSelectAll);
            selectAllCheckbox.addEventListener('change', handleSelectAll);
        } else {
            console.warn('selectAllStorages 요소를 찾을 수 없습니다!');
        }
        
        // 일괄 상태 변경 버튼
        if (applyBulkStatusBtn && bulkStatusSelect) {
            applyBulkStatusBtn.removeEventListener('click', handleBulkStatusChange);
            applyBulkStatusBtn.addEventListener('click', handleBulkStatusChange);
        } else {
            console.warn('일괄 상태 변경 관련 요소를 찾을 수 없습니다!');
        }
    }
    
    // 전체 선택/해제 처리 함수
    function handleSelectAll(e) {
        document.querySelectorAll('.storage-select-checkbox').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    }
    
    // 일괄 상태 변경 처리 함수
    async function handleBulkStatusChange() {
        const bulkStatusSelect = document.getElementById('bulkStatusSelect');
        if (!bulkStatusSelect) return;
        
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
                await loadStorages(); // 목록 새로고침
            } catch (error) {
                alert(`일괄 상태 업데이트 실패: ${error.message}`);
            }
        }
    }
    
    // 모달 관련 기능 설정
    function setupModal() {
        if (!modal || !form) {
            console.warn('모달 관련 요소를 찾을 수 없습니다!');
            return;
        }
        
        // 모달 열기 함수
        window.openStorageModal = function(storage = null) {
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
        }
        
        // 모달 닫기 함수
        window.closeStorageModal = function() {
            modal.classList.add('hidden');
        }
        
        // 이벤트 리스너 설정
        if (addBtn) {
            addBtn.removeEventListener('click', handleAddBtnClick);
            addBtn.addEventListener('click', handleAddBtnClick);
        }
        
        if (cancelBtn) {
            cancelBtn.removeEventListener('click', window.closeStorageModal);
            cancelBtn.addEventListener('click', window.closeStorageModal);
        }
        
        // 폼 제출 이벤트
        if (form) {
            form.removeEventListener('submit', handleFormSubmit);
            form.addEventListener('submit', handleFormSubmit);
        }
    }
    
    // 추가 버튼 클릭 핸들러
    function handleAddBtnClick() {
        window.openStorageModal();
    }
    
    // 폼 제출 핸들러
    async function handleFormSubmit(e) {
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
            window.closeStorageModal();
            await loadStorages(); // 목록 새로고침
        } catch (error) {
            alert(`저장 실패: ${error.message}`);
        }
    }
    
    // 테이블 행 이벤트 설정
    function setupTableEvents() {
        if (!storageListBody) return;
        
        // 기존 이벤트 리스너 제거
        storageListBody.removeEventListener('click', handleTableClick);
        storageListBody.removeEventListener('change', handleTableChange);
        
        // 새 이벤트 리스너 추가 (이벤트 위임)
        storageListBody.addEventListener('click', handleTableClick);
        storageListBody.addEventListener('change', handleTableChange);
    }
    
    // 테이블 클릭 이벤트 핸들러
    async function handleTableClick(e) {
        // 수정 버튼 클릭
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            try {
                const storage = await fetchStorageByIdAdmin(id); // admin-api.js
                window.openStorageModal(storage);
            } catch (error) {
                alert(`정보 불러오기 실패: ${error.message}`);
            }
        }
        
        // 삭제 버튼 클릭
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('정말로 이 짐보관소를 삭제하시겠습니까?')) {
                try {
                    await deleteStorageAdmin(id); // admin-api.js
                    await loadStorages(); // 목록 새로고침
                } catch (error) {
                    alert(`삭제 실패: ${error.message}`);
                }
            }
        }
    }
    
    // 테이블 변경 이벤트 핸들러 (상태 변경 드롭다운)
    async function handleTableChange(e) {
        if (e.target.classList.contains('status-select')) {
            const id = e.target.dataset.id;
            const isOpen = e.target.value === 'true';
            try {
                await updateStorageStatusAdmin(id, isOpen);
                alert('상태가 성공적으로 업데이트되었습니다.');
                await loadStorages(); // 목록 새로고침
            } catch (error) {
                alert(`상태 업데이트 실패: ${error.message}`);
            }
        }
    }
    
    // 초기화 메인 로직
    if (!isInitialized) {
        console.log('첫 초기화 실행 중...');
        
        // 1. 검색 기능 설정
        setupSearch();
        
        // 2. 일괄 상태 변경 기능 설정
        setupBulkActions();
        
        // 3. 모달 관련 기능 설정
        setupModal();
        
        // 4. 테이블 행 이벤트 설정
        setupTableEvents();
        
        // 초기화 완료 표시
        isInitialized = true;
        console.log('초기화 완료!');
    } else {
        console.log('이미 초기화됨. 데이터만 새로 로드합니다.');
    }
    
    // 항상 데이터 로드 (초기화 상태와 무관하게)
    loadStorages();
}

// 메뉴 클릭 및 해시 변경 감지
function setupNavigationHandlers() {
    console.log('네비게이션 핸들러 설정');
    
    // 1. 메뉴 클릭 이벤트 리스너
    document.addEventListener('click', (e) => {
        const storageLink = e.target.closest('a[href*="#storage-management"]');
        if (storageLink) {
            console.log('짐보관소 관리 메뉴 클릭 감지');
            // 약간의 지연 후 초기화 (DOM 업데이트 시간 확보)
            setTimeout(() => {
                initStorageManagement();
            }, 200);
        }
    });
    
    // 2. 해시 변경 이벤트 리스너
    window.addEventListener('hashchange', () => {
        console.log('해시 변경 감지:', window.location.hash);
        if (window.location.hash === '#storage-management') {
            console.log('해시가 #storage-management로 변경됨');
            // 약간의 지연 후 초기화 (DOM 업데이트 시간 확보)
            setTimeout(() => {
                initStorageManagement();
            }, 200);
        }
    });
    
    // 3. 페이지 로드 시 확인
    if (window.location.hash === '#storage-management') {
        console.log('페이지 로드 시 #storage-management 해시 감지');
        // 약간의 지연 후 초기화 (DOM 업데이트 시간 확보)
        setTimeout(() => {
            initStorageManagement();
        }, 200);
    }
}

// 커스텀 이벤트 핸들러 (SPA에서 콘텐츠 동적 로드 감지용)
function setupCustomEventHandlers() {
    // 예: contentLoaded, pageChanged 등의 커스텀 이벤트
    document.addEventListener('contentLoaded', (e) => {
        console.log('contentLoaded 이벤트 감지', e.detail);
        if (window.location.hash === '#storage-management') {
            setTimeout(() => {
                initStorageManagement();
            }, 200);
        }
    });
}

// 페이지 초기화 즉시 실행 함수
(function() {
    console.log('storage-manager.js 로드됨');
    
    // DOM 로드 완료 감지
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded 이벤트 발생');
            setupNavigationHandlers();
            setupCustomEventHandlers();
        });
    } else {
        // 이미 DOM이 로드된 상태
        console.log('DOM이 이미 로드된 상태');
        setupNavigationHandlers();
        setupCustomEventHandlers();
    }
})();