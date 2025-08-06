/**
 * storage-list.js
 * 짐보관소 목록 표시 및 관리 기능을 담당합니다.
 */

// 짐보관소 목록을 로드하고 표시하는 함수
async function loadStorageList() {
    const listContainer = document.querySelector('#list .grid');
    if (!listContainer) return;
    
    try {
        // 로딩 표시
        listContainer.innerHTML = '<div class="col-span-full text-center py-8"><p>짐보관소 정보를 불러오는 중...</p></div>';
        
        // API에서 데이터 가져오기
        const storages = await fetchAllStorages();
        
        // 리스트 비우기
        listContainer.innerHTML = '';
        
        if (storages && storages.length > 0) {
            // 실제 데이터로 리스트 생성
            storages.forEach((storage, index) => {
                const storageCard = createStorageCard(storage);
                listContainer.appendChild(storageCard);

                // 3번째 아이템 뒤에 광고 카드 삽입
                if (index === 2) {
                    const adCard = createAdCard('list-ad');
                    listContainer.appendChild(adCard);
                }
            });
            
            // 로그인 안내 메시지 추가
            if (storages.length === 2 && !localStorage.getItem('adminToken')) { // adminToken으로 로그인 여부 판단
                const loginPrompt = document.createElement('div');
                loginPrompt.className = 'col-span-full text-center py-4 text-blue-600 font-semibold';
                loginPrompt.innerHTML = '<p>로그인하시면 더 많은 짐보관소를 볼 수 있습니다.</p>';
                listContainer.appendChild(loginPrompt);
            }
            
            // 더보기 버튼이 있다면 업데이트
            updateLoadMoreButton(storages.length);
        } else {
            // 데이터가 없는 경우
            listContainer.innerHTML = '<div class="col-span-full text-center py-8"><p>등록된 짐보관소가 없습니다.</p></div>';
        }
    } catch (error) {
        console.error('짐보관소 목록 로드 실패:', error);
        listContainer.innerHTML = '<div class="col-span-full text-center py-8"><p>데이터를 불러오는 데 실패했습니다. 다시 시도해주세요.</p></div>';
    }
}

// 짐보관소 카드 HTML 엘리먼트 생성
function createStorageCard(storage) {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow-md';
    card.setAttribute('data-id', storage._id || '0');
    
    // 운영 시간 표시 설정
    let hours = "정보 없음";
    if (storage.is24Hours) {
        hours = "24시간";
    } else if (storage.openTime && storage.closeTime) {
        hours = `${storage.openTime}~${storage.closeTime}`;
    }
    
    // 카드 내용 설정
    card.innerHTML = `
        <h4 class="font-bold text-lg">${storage.name}</h4>
        <p class="text-gray-600 mb-2">${storage.address || '주소 정보 없음'}</p>
        <div class="flex items-center mb-2">
            <span class="${(storage.status && storage.status.isOpen) ? 'text-green-600' : 'text-red-600'} font-medium mr-2">
                ${(storage.status && storage.status.isOpen) ? '개방중' : '마감'}
            </span>
            <span class="text-sm text-gray-500">운영시간: ${hours}</span>
        </div>
        <div class="flex items-center text-sm mb-2">
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">소형: ${(storage.smallPrice || 0).toLocaleString()}원/일</span>
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">대형: ${(storage.largePrice || 0).toLocaleString()}원/일</span>
        </div>
        <div class="flex justify-between mt-2">
            <button class="text-blue-600 hover:underline detail-btn" data-id="${storage._id || '0'}">상세정보</button>
            <span class="text-gray-500 text-sm">${getUpdateTimeText(storage.status && storage.status.lastUpdated)}</span>
        </div>
    `;
    
    // 상세정보 버튼 이벤트 연결
    const detailBtn = card.querySelector('.detail-btn');
    if (detailBtn) {
        detailBtn.addEventListener('click', () => {
            showStorageDetails(detailBtn.getAttribute('data-id'));
        });
    }
    
    return card;
}

// 광고 카드 HTML 엘리먼트 생성
function createAdCard(type) {
    const adCard = document.createElement('div');
    adCard.className = 'bg-gray-200 p-4 rounded-lg shadow-md text-center';
    
    if (type === 'list-ad') {
        adCard.innerHTML = `
            <h5 class="font-bold text-gray-800">광고</h5>
            <p class="text-gray-600">이목을 집중시키는 광고를 여기에 넣어보세요!</p>
            <a href="#" class="text-blue-600 hover:underline">더 알아보기</a>
        `;
    } else if (type === 'banner-ad') {
        adCard.className = 'fixed bottom-0 left-0 right-0 bg-yellow-300 p-2 text-center shadow-lg z-50';
        adCard.innerHTML = `
            <p class="text-sm text-yellow-800">✨ 특별 할인 이벤트! 지금 예약하고 20% 할인 받으세요! <a href="#" class="font-bold underline">자세히 보기</a></p>
        `;
    }
    
    return adCard;
}

// 업데이트 시간 표시 형식 생성
function getUpdateTimeText(updateTime) {
    if (!updateTime) return '정보 없음';
    
    const updated = new Date(updateTime);
    const now = new Date();
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}일 전`;
    
    return `${updated.getFullYear()}.${updated.getMonth() + 1}.${updated.getDate()}`;
}

// 더보기 버튼 업데이트
function updateLoadMoreButton(itemCount) {
    const loadMoreBtn = document.querySelector('#list .text-center button');
    if (loadMoreBtn) {
        // 아이템이 적으면 버튼 숨기기
        if (itemCount < 3) { 
            loadMoreBtn.classList.add('hidden');
        } else {
            loadMoreBtn.classList.remove('hidden');
            
            // 이벤트 리스너 재설정 (중복 방지)
            loadMoreBtn.replaceWith(loadMoreBtn.cloneNode(true));
            const newLoadMoreBtn = document.querySelector('#list .text-center button');
            
            // 새 이벤트 리스너 등록
            newLoadMoreBtn.addEventListener('click', () => {
                loadMoreStorages();
            });
        }
    }
}

// 추가 짐보관소 로드 (페이지네이션)
async function loadMoreStorages() {
    // 현재 표시된 카드 개수
    const currentCount = document.querySelectorAll('#list .grid > div').length;
    const ITEMS_PER_PAGE = 6; // 한 번에 로드할 항목 수
    
    try {
        // 모든 데이터 가져오기
        const storages = await fetchAllStorages();
        
        // 더 보여줄 데이터가 없으면 버튼 숨김
        if (currentCount >= storages.length) {
            const loadMoreBtn = document.querySelector('#list .text-center button');
            if (loadMoreBtn) {
                loadMoreBtn.classList.add('hidden');
            }
            return;
        }
        
        // 추가 데이터 표시
        const listContainer = document.querySelector('#list .grid');
        if (listContainer && storages.length > currentCount) {
            const nextItems = storages.slice(currentCount, currentCount + ITEMS_PER_PAGE);
            
            nextItems.forEach(storage => {
                const storageCard = createStorageCard(storage);
                listContainer.appendChild(storageCard);
            });
            
            // 모든 데이터를 표시했으면 버튼 숨김
            if (currentCount + nextItems.length >= storages.length) {
                const loadMoreBtn = document.querySelector('#list .text-center button');
                if (loadMoreBtn) {
                    loadMoreBtn.classList.add('hidden');
                }
            }
        }
    } catch (error) {
        console.error('추가 짐보관소 데이터 로드 실패:', error);
        alert('추가 데이터를 불러오는 데 실패했습니다.');
    }
}

// 검색 결과 표시
async function displaySearchResults(keyword) {
    const listSection = document.getElementById('list');
    if (!listSection) return;
    
    try {
        // 검색 결과를 가져옴
        const results = await searchStorages(keyword);
        
        // 섹션 제목 업데이트
        const sectionTitle = listSection.querySelector('h3');
        if (sectionTitle) {
            sectionTitle.textContent = `"${keyword}" 검색 결과 (${results.length}개)`;
        }
        
        // 리스트 컨테이너 비우기
        const listContainer = listSection.querySelector('.grid');
        if (listContainer) {
            listContainer.innerHTML = '';
            
            if (results.length > 0) {
                // 검색 결과 표시
                results.forEach(storage => {
                    const storageCard = createStorageCard(storage);
                    listContainer.appendChild(storageCard);
                });
                
                // 더보기 버튼 숨기기
                const loadMoreBtn = listSection.querySelector('.text-center button');
                if (loadMoreBtn) {
                    loadMoreBtn.classList.add('hidden');
                }
                
                // 섹션으로 스크롤
                listSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // 결과 없음 메시지
                listContainer.innerHTML = '<div class="col-span-full text-center py-8"><p>검색 결과가 없습니다.</p></div>';
            }
        }
    } catch (error) {
        console.error('검색 결과 표시 실패:', error);
        alert('검색 중 오류가 발생했습니다.');
    }
}

// 검색 결과 초기화 (모든 짐보관소 표시)
function resetSearchResults() {
    const listSection = document.getElementById('list');
    if (!listSection) return;
    
    // 섹션 제목 복원
    const sectionTitle = listSection.querySelector('h3');
    if (sectionTitle) {
        sectionTitle.textContent = '짐보관소 리스트';
    }
    
    // 리스트 다시 로드
    loadStorageList();
}