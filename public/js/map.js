/**
 * map.js
 * 지도 관련 기능을 담당하는 파일입니다.
 */

// 전역 변수
let googleMap;
let reportMarker = null;
let userLocationMarker = null; // 내 위치 마커를 위한 전역 변수 추가
let storageMarkers = []; // 짐보관소 마커들을 저장할 배열

// 지도 초기화
function initMap() {
    try {
        // 서울 중심 좌표
        const seoul = { lat: 37.5665, lng: 126.9780 };
        
        clearAllMarkers(); // 모든 마커를 항상 제거

        // 지도가 아직 초기화되지 않았다면 새 지도 생성
        if (!googleMap) {
            const map = new google.maps.Map(document.getElementById("mapContainer"), {
                zoom: 13,
                center: seoul,
            });
            
            // 전역 변수에 지도 객체 저장
            googleMap = map;
            window.googleMap = map;
            
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
                    
                    reverseGeocodeAndSetAddress(lat, lng);
                    
                    // 마커 추가
                    updateReportMarker(map, lat, lng);
                }
            });
        } else {
            // 지도가 이미 있다면 중심과 줌만 재설정
            googleMap.setCenter(seoul);
            googleMap.setZoom(13);
        }
        
        // API에서 짐보관소 데이터 가져오기
        loadStoragesToMap(googleMap);
        
        // 현재 위치 버튼 추가
        addCurrentLocationButton();
    } catch (error) {
        console.error('initMap 함수 실행 중 오류 발생:', error);
    }
}

// 모든 마커를 지도에서 제거하고 초기화하는 함수
function clearAllMarkers() {
    // 짐보관소 마커 제거
    storageMarkers.forEach(marker => marker.setMap(null));
    storageMarkers = [];

    // 제보 마커 제거
    if (reportMarker) {
        reportMarker.setMap(null);
        reportMarker = null;
    }

    // 내 위치 마커 제거
    if (userLocationMarker) {
        userLocationMarker.setMap(null);
        userLocationMarker = null;
    }
}

// 서버에서 짐보관소 데이터 가져와서 지도에 표시
async function loadStoragesToMap(map) {
    try {
        const storages = await api.getStorages();
        
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
        const marker = createMarker(map, storage);
        storageMarkers.push(marker); // 생성된 마커를 배열에 추가
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
            <hr style="margin: 5px 0;">
            <p style="font-size: 0.8em; color: #666;">광고: 주변 맛집 추천! <a href="#" target="_blank">할인쿠폰 받기</a></p>
            <button style="background-color: #3b82f6; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px;"
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

// 역지오코딩을 수행하고 주소 필드를 채우는 함수
function reverseGeocodeAndSetAddress(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': { lat, lng } }, (results, status) => {
        console.log('역지오코딩 상태:', status);
        if (status === 'OK') {
            if (results[0]) {
                console.log('역지오코딩 결과 주소:', results[0].formatted_address);
                const addressInput = document.getElementById('address');
                if (addressInput) {
                    console.log('주소 입력 필드 찾음. 값 설정 중...');
                    addressInput.value = results[0].formatted_address;
                    console.log('주소 입력 필드 값 설정 완료:', addressInput.value);
                } else {
                    console.warn('주소 입력 필드 (ID: address)를 찾을 수 없습니다.');
                }
                const locationInfo = document.getElementById('locationInfo');
                if(locationInfo) {
                    locationInfo.textContent = `선택한 위치: ${results[0].formatted_address} (위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)})`;
                    locationInfo.classList.remove('hidden');
                }
            } else {
                console.warn('주소를 찾을 수 없습니다.');
                const locationInfo = document.getElementById('locationInfo');
                if(locationInfo) {
                    locationInfo.textContent = `선택한 위치: 주소 없음 (위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)})`;
                    locationInfo.classList.remove('hidden');
                }
            }
        } else {
            console.error('역지오코딩 실패:', status);
            const locationInfo = document.getElementById('locationInfo');
            if(locationInfo) {
                locationInfo.textContent = `선택한 위치: 역지오코딩 실패 (위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)})`;
                locationInfo.classList.remove('hidden');
            }
        }
    });
}

// 상세 정보 표시 함수
async function showStorageDetails(storageId) {
    if (!googleMap) {
        alert('지도가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    try {
        const storages = await api.getStorages();
        const targetStorage = storages.find(s => s._id === storageId);

        if (targetStorage) {
            // 메타 태그 업데이트
            const title = `${targetStorage.name} - 내 주변 짐보관소 찾기`;
            const description = `${targetStorage.address}에 위치한 ${targetStorage.name}의 상세 정보입니다. 운영 시간, 가격, 실시간 현황을 확인하세요.`;
            if (typeof updateMetaTags === 'function') {
                updateMetaTags(title, description);
            }

            const lat = targetStorage.location.coordinates ? targetStorage.location.coordinates[1] : targetStorage.lat;
            const lng = targetStorage.location.coordinates ? targetStorage.location.coordinates[0] : targetStorage.lng;

            if (lat && lng) {
                const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
                googleMap.setCenter(position);
                googleMap.setZoom(15); // 상세 정보를 볼 때 확대

                // 해당 짐보관소 마커를 다시 생성하여 정보창을 띄움
                const marker = createMarker(googleMap, targetStorage);
                google.maps.event.trigger(marker, 'click');

            } else {
                alert('선택된 짐보관소의 위치 정보가 유효하지 않습니다.');
            }
        } else {
            alert('짐보관소 정보를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('짐보관소 상세 정보 표시 실패:', error);
        alert('짐보관소 상세 정보를 불러오는 데 실패했습니다.');
    }
}

// 현재 위치 버튼 추가
function addCurrentLocationButton() {
    const mapSection = document.getElementById('map');
    if (mapSection) {
        // 버튼이 이미 존재하는지 확인
        let currentLocationBtn = document.getElementById('currentLocationBtn');
        if (!currentLocationBtn) {
            currentLocationBtn = document.createElement('button');
            currentLocationBtn.id = 'currentLocationBtn'; // ID 추가
            currentLocationBtn.className = 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-2 mr-2';
            currentLocationBtn.textContent = '내 위치 찾기';
            currentLocationBtn.addEventListener('click', getCurrentLocation);
            
            const mapHeading = mapSection.querySelector('h3');
            if (mapHeading) {
                mapHeading.parentNode.insertBefore(currentLocationBtn, mapHeading.nextSibling);
            }
        }
    }
}

// 사용자 현재 위치 가져오기
function getCurrentLocation() {
    console.log('getCurrentLocation 함수 호출됨');
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
                    
                    // 기존 사용자 위치 마커 제거
                    if (userLocationMarker) {
                        console.log('기존 userLocationMarker 제거');
                        userLocationMarker.setMap(null);
                    }

                    // 사용자 위치 마커 추가
                    userLocationMarker = new google.maps.Marker({
                        position: userLocation,
                        map: googleMap,
                        title: "내 위치",
                        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    });
                    console.log('새 userLocationMarker 생성됨', userLocationMarker);
                    
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