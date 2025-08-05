// 지도 초기화 함수
function initMap() {
    // 서울 중심 좌표
    const seoul = { lat: 37.5665, lng: 126.9780 };
    
    // 새 지도 생성
    const map = new google.maps.Map(document.getElementById("mapContainer"), {
        zoom: 13,
        center: seoul,
    });
    
    // 샘플 짐보관소 데이터
    const locations = [
        { 
            name: "서울역 짐보관소", 
            position: { lat: 37.5546, lng: 126.9706 },
            isOpen: true,
            hours: "06:00~23:00",
            smallPrice: 3000,
            largePrice: 5000
        },
        { 
            name: "명동 짐보관소", 
            position: { lat: 37.5635, lng: 126.9856 },
            isOpen: true,
            hours: "24시간",
            smallPrice: 4000,
            largePrice: 7000
        },
        { 
            name: "부산역 짐보관소", 
            position: { lat: 35.1151, lng: 129.0420 },
            isOpen: false,
            hours: "07:00~22:00",
            smallPrice: 3000,
            largePrice: 6000
        }
    ];
    
    // 마커 및 정보창 생성
    locations.forEach(location => {
        const marker = new google.maps.Marker({
            position: location.position,
            map: map,
            title: location.name,
            icon: location.isOpen ? 
                'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
                'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        
        // 정보창 콘텐츠
        const contentString = `
            <div style="padding: 10px; max-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 5px;">${location.name}</h3>
                <p style="color: ${location.isOpen ? 'green' : 'red'}; margin-bottom: 5px;">
                    ${location.isOpen ? '개방중' : '마감'}
                </p>
                <p style="margin-bottom: 5px;">운영시간: ${location.hours}</p>
                <p style="margin-bottom: 5px;">소형: ${location.smallPrice.toLocaleString()}원/일</p>
                <p style="margin-bottom: 5px;">대형: ${location.largePrice.toLocaleString()}원/일</p>
                <button style="background-color: #3b82f6; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer;">상세정보</button>
            </div>
        `;
        
        const infowindow = new google.maps.InfoWindow({
            content: contentString,
        });
        
        marker.addListener("click", () => {
            infowindow.open(map, marker);
        });
    });
}

// 페이지 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 검색 기능
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                alert(`"${query}" 검색 결과를 불러옵니다.`);
                // 실제 구현에서는 여기서 검색 API 호출
            } else {
                alert('검색어를 입력해주세요.');
            }
        });
        
        // 엔터키로 검색
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });
    }
    
    // 제보하기 폼 제출
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 폼 데이터 수집
            const formData = new FormData(reportForm);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // 실제 구현에서는 여기서 API 호출
            console.log('제보 데이터:', data);
            alert('짐보관소 제보가 완료되었습니다. 검토 후 적립금이 지급됩니다!');
            reportForm.reset();
        });
    }
    
    // 광고 로드 (실제 광고 네트워크 연동 필요)
    loadAds();
});

// 광고 로딩 함수 (예시)
function loadAds() {
    // 광고 컨테이너 생성
    const adContainers = document.createElement('div');
    adContainers.className = 'ad-container';
    adContainers.innerHTML = '<p>광고 영역 - 귀하의 비즈니스를 홍보하세요!</p>';
    
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

// 사용자 현재 위치 가져오기
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // 지도 중심 위치 변경 (지도가 이미 로드된 경우)
                const map = window.googleMap;
                if (map) {
                    map.setCenter(userLocation);
                    
                    // 사용자 위치 마커 추가
                    new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: "내 위치",
                        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    });
                }
            },
            (error) => {
                console.error("위치 정보를 가져올 수 없습니다:", error);
            }
        );
    } else {
        alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
}