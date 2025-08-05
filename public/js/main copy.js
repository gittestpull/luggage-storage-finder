/**
 * main.js
 * 애플리케이션의 메인 초기화 코드와 전반적인 이벤트 핸들러를 관리합니다.
 */

// 페이지 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 검색 기능 초기화
    initSearchFeature();
    
    // 제보 폼 초기화
    initReportForm();
    
    // 짐보관소 리스트 로드
    loadStorageList();
    
    // 더보기 버튼 이벤트 연결
    initLoadMoreButton();
    
    // 광고 로드
    loadAds();
});

// 검색 기능 초기화
function initSearchFeature() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton && searchInput) {
        // 검색 버튼 클릭 이벤트
        searchButton.addEventListener('click', function() {
            performSearch();
        });
        
        // 엔터키로 검색
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // 검색 입력 필드 지우기 버튼 추가
        addSearchClearButton(searchInput);
    }
}

// 검색 실행
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (query) {
        // 검색 결과 표시
        displaySearchResults(query);
    } else {
        alert('검색어를 입력해주세요.');
    }
}

// 검색 입력 필드에 지우기 버튼 추가
function addSearchClearButton(searchInput) {
    // 입력 필드 컨테이너에 상대적 위치 설정
    const inputContainer = searchInput.parentElement;
    inputContainer.style.position = 'relative';
    
    // 지우기 버튼 생성
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hidden';
    clearButton.innerHTML = '&times;'; // X 표시
    clearButton.style.fontSize = '1.5rem';
    clearButton.style.lineHeight = '1';
    clearButton.style.padding = '0 0.5rem';
    
    // 버튼 이벤트 연결
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        clearButton.classList.add('hidden');
        searchInput.focus();
        
        // 검색 결과 초기화
        resetSearchResults();
    });
    
    // 입력 필드에 키 이벤트 추가
    searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            clearButton.classList.remove('hidden');
        } else {
            clearButton.classList.add('hidden');
        }
    });
    
    // 입력 필드 다음에 버튼 삽입
    inputContainer.insertBefore(clearButton, searchInput.nextSibling);
}

// 더보기 버튼 초기화
function initLoadMoreButton() {
    const loadMoreBtn = document.querySelector('#list .text-center button');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreStorages);
    }
}

// 광고 로딩 함수
function loadAds() {
    // 광고 컨테이너 생성
    const adContainers = document.createElement('div');
    adContainers.className = 'ad-container mt-8 p-4 bg-yellow-100 text-center rounded-lg';
    adContainers.innerHTML = `
        <p class="font-bold mb-2">광고</p>
        <p>귀하의 비즈니스를 짐보관소 찾기 서비스의 12만 사용자에게 홍보하세요!</p>
        <button class="bg-yellow-500 text-white px-4 py-1 rounded mt-2 hover:bg-yellow-600">광고 문의하기</button>
    `;
    
    // 적절한 위치에 광고 삽입
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
        // 리스트 섹션 뒤에 광고 삽입
        const listSection = document.getElementById('list');
        if (listSection && listSection.nextSibling) {
            mainContainer.insertBefore(adContainers, listSection.nextSibling);
        }
    }
}