/**
 * map.js
 * 지도 관련 기능을 담당하는 파일입니다.
 */

// 전역 변수
let googleMap;
let reportMarker = null;

// 지도 초기화
function initMap() {
    // 서울 중심 좌표
    const seoul = { lat: 37.5665, lng: 126.9780 };
    
    // 새 지도 생성
    const map = new google.maps.Map(document.getElementById("mapContainer"), {
        zoom: 13,
        center: seoul,
    });
    
    // 전역 변수에 지도 객체 저장
    googleMap = map;
    window.googleMap = map;
    
    // API에서 짐보관소 데이터 가져오기
    loadStoragesToMap(map);
    
    // 지도 클릭 이벤트 - 제보 폼 좌표 설정
    map.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // 제보 폼에 위도/경도 설정 
        const latInput = document.getElementById('lat');
        const lngInput = document.getElementById('lng');
        
        if(latInput && lngInput) {
            latInput.value = lat;
            lngInput.value = lng;
            
            // 마커 추가
            updateReportMarker(map, lat, lng);
            
            // 알림
            const locationInfo = document.getElementById('locationInfo');
            if(locationInfo) {
                locationInfo.textContent = `선택한 위치: 위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)}`;
                locationInfo.classList.remove('hidden');
            }
        }
    });
    
    // 현재 위치 버튼 추가
    addCurrentLocationButton();
}

// 서버에서 짐보관소 데이터 가져와서 지도에 표시
async function loadStoragesToMap(map) {
    try {
        const storages = await fetchAllStorages();
        
        if (storages && storages.length > 0) {
            // 서버에서 받은 데이터로 마커 생성
            displayStoragesOnMap(map, storages);
        } else {
            // 데이터가 없는 경우 샘플 데이터 사용
            displaySampleStorages(map);
        }
    } catch (error) {
        console.error('지도에 짐보관소 데이터 로드 실패:', error);
        // 오류 발생 시 샘플 데이터 사용
        displaySampleStorages(map);
    }
}

// 샘플 데이터 표시 (API 실패 시)
function displaySampleStorages(map) {
    // 샘플 짐보관소 데이터
    const locations = [
        { 
            name: "서울역 짐보관소", 
            position: { lat: 37.5546, lng: 126.9706 },
            isOpen: true,
            hours: "06:00~23:00",
            smallPrice: 3000,
            largePrice: 5000,
            address: "서울특별시 용산구 한강대로 405"
        },
        { 
            name: "명동 짐보관소", 
            position: { lat: 37.5635, lng: 126.9856 },
            isOpen: true,
            hours: "24시간",
            smallPrice: 4000,
            largePrice: 7000,
            address: "서울특별시 중구 명동길 74"
        },
        { 
            name: "부산역 짐보관소", 
            position: { lat: 35.1151, lng: 129.0420 },
            isOpen: false,
            hours: "07:00~22:00",
            smallPrice: 3000,
            largePrice: 6000,
            address: "부산광역시 동구 중앙대로 206"
        }
    ];
    
    // 마커 생성
    locations.forEach(location => {
        createMarker(map, {
            name: location.name,
            address: location.address,
            location: {
                coordinates: [location.position.lng, location.position.lat]
            },
            status: {
                isOpen: location.isOpen
            },
            openTime: location.hours.split('~')[0],
            closeTime: location.hours.split('~')[1] || '24:00',
            smallPrice: location.smallPrice,
            largePrice: location.largePrice
        });
    });
}

// API 데이터를 지도에 표시
function displayStoragesOnMap(map, storages) {
    storages.forEach(storage => {
        createMarker(map, storage);
    });
}

// 마커 생성 함수
function createMarker(map, storage) {
    // 좌표 데이터 구조에 따라 처리
    const lat = storage.location.coordinates ? storage.location.coordinates[1] : storage.lat;
    const lng = storage.location.coordinates ? storage.location.coordinates[0] : storage.lng;
    
    const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: storage.name,
        icon: storage.status && storage.status.isOpen ? 
            'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
            'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    });
    
    // 운영 시간 표시
    let hours = "정보 없음";
    if (storage.is24Hours) {
        hours = "24시간";
    } else if (storage.openTime && storage.closeTime) {
        hours = `${storage.openTime}~${storage.closeTime}`;
    }
    
    // 정보창 콘텐츠
    const contentString = `
        <div style="padding: 10px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">${storage.name}</h3>
            <p style="margin-bottom: 5px;">${storage.address || ''}</p>
            <p style="color: ${(storage.status && storage.status.isOpen) ? 'green' : 'red'}; margin-bottom: 5px;">
                ${(storage.status && storage.status.isOpen) ? '개방중' : '마감'}
            </p>
            <p style="margin-bottom: 5px;">운영시간: ${hours}</p>
            <p style="margin-bottom: 5px;">소형: ${(storage.smallPrice || 0).toLocaleString()}원/일</p>
            <p style="margin-bottom: 5px;">대형: ${(storage.largePrice || 0).toLocaleString()}원/일</p>
            <button style="background-color: #3b82f6; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer;"
                onclick="showStorageDetails('${storage._id || '0'}')">상세정보</button>
        </div>
    `;
    
    const infowindow = new google.maps.InfoWindow({
        content: contentString,
    });
    
    marker.addListener("click", () => {
        infowindow.open(map, marker);
    });
    
    return marker;
}

// 제보 마커 업데이트
function updateReportMarker(map, lat, lng) {
    // 기존 마커 제거
    if (reportMarker) {
        reportMarker.setMap(null);
    }
    
    // 새 마커 생성
    reportMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: "제보 위치",
        icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
    });
}

// 상세 정보 표시 함수
function showStorageDetails(storageId) {
    alert(`짐보관소 ID: ${storageId}의 상세 정보를 표시합니다.`);
    // 실제 구현에서는 상세 정보 모달 또는 페이지로 이동
}

// 현재 위치 버튼 추가
function addCurrentLocationButton() {
    const mapSection = document.getElementById('map');
    if (mapSection) {
        const currentLocationBtn = document.createElement('button');
        currentLocationBtn.className = 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-2 mr-2';
        currentLocationBtn.textContent = '내 위치 찾기';
        currentLocationBtn.addEventListener('click', getCurrentLocation);
        
        const mapHeading = mapSection.querySelector('h3');
        if (mapHeading) {
            mapHeading.parentNode.insertBefore(currentLocationBtn, mapHeading.nextSibling);
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
                
                // 지도 중심 위치 변경
                if (googleMap) {
                    googleMap.setCenter(userLocation);
                    googleMap.setZoom(15); // 확대
                    
                    // 사용자 위치 마커 추가
                    new google.maps.Marker({
                        position: userLocation,
                        map: googleMap,
                        title: "내 위치",
                        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    });
                    
                    // 제보 폼에 위치 정보 설정
                    const latInput = document.getElementById('lat');
                    const lngInput = document.getElementById('lng');
                    
                    if (latInput && lngInput) {
                        latInput.value = userLocation.lat;
                        lngInput.value = userLocation.lng;
                        
                        // 위치 정보 표시
                        const locationInfo = document.getElementById('locationInfo');
                        if (locationInfo) {
                            locationInfo.textContent = `내 위치: 위도 ${userLocation.lat.toFixed(6)}, 경도 ${userLocation.lng.toFixed(6)}`;
                            locationInfo.classList.remove('hidden');
                        }
                    }
                }
            },
            (error) => {
                console.error("위치 정보를 가져올 수 없습니다:", error);
                alert("위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 접근 권한을 확인해주세요.");
            }
        );
    } else {
        alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
}