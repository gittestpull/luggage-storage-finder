document.addEventListener('DOMContentLoaded', () => {
    let map;
    let userLocationMarker = null;
    let storageMarkers = [];
    let currentArticleMarkers = []; // 현재 선택된 기사의 모든 위치 마커
    const allArticleMarkers = new Map(); // K: article.url, V: Array of markers for that article
    const articleElements = new Map(); // K: article.url, V: { card }
    let currentUserLocation = null;

    const mapContainer = document.getElementById('mapContainer');
    const nearbyList = document.getElementById('nearby-list');
    const newsListContainer = document.getElementById('news-list');
    const findMyLocationBtn = document.getElementById('find-my-location-btn');
    const nearbyListTitle = document.getElementById('nearby-list-title');

    // Mobile panel elements
    const mapPanel = document.getElementById('map-panel');
    const mapFab = document.getElementById('map-fab');
    const closeMapBtn = document.getElementById('close-map-btn');

    const ICONS = {
        defaultArticle: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
        highlightArticle: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        storage: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        user: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
    };

    // --- Initialization ---

    window.initMap = async () => {
        try {
            const articles = await fetchNews();
            // 전역 변수에 저장하여 다른 함수에서 접근할 수 있도록 함
            window.newsArticles = articles; 
            initializeMap(articles);
            displayNews(articles);
        } catch (error) {
            console.error(error);
            newsListContainer.innerHTML = `
                <p class="text-center text-red-500">뉴스 로딩 중 오류가 발생했습니다.</p>
                <pre class="mt-4 text-left text-xs text-red-700 bg-red-100 p-4 rounded">${error.stack}</pre>
            `;
        }
    };
    
    findMyLocationBtn.addEventListener('click', handleFindMyLocation);

    // Mobile panel event listeners
    if (mapFab && mapPanel && closeMapBtn) {
        mapFab.addEventListener('click', () => {
            mapPanel.classList.remove('translate-x-full');
            // Trigger map resize after the panel is visible to ensure correct rendering
            setTimeout(() => {
                google.maps.event.trigger(map, 'resize');
            }, 300); // Wait for CSS transition
        });

        closeMapBtn.addEventListener('click', () => {
            mapPanel.classList.add('translate-x-full');
        });
    }

    // --- Data Fetching ---

    async function fetchNews() {
        const response = await fetch('/api/news');
        if (!response.ok) throw new Error('뉴스를 불러오는 데 실패했습니다.');
        return await response.json();
    }

    async function fetchStorages(location) {
        const storages = await api.getStorages();
        if (!storages || storages.length === 0) return [];
        
        return storages.map(storage => {
            const storageLocation = {
                lat: storage.location.coordinates[1],
                lng: storage.location.coordinates[0]
            };
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(location.lat, location.lng),
                new google.maps.LatLng(storageLocation.lat, storageLocation.lng)
            );
            return { ...storage, distance };
        }).sort((a, b) => a.distance - b.distance);
    }
    
    // --- Map Logic ---

    function initializeMap(articles) {
        const initialLocation = { lat: 37.5665, lng: 126.9780 }; // Default to Seoul
        map = new google.maps.Map(mapContainer, {
            center: initialLocation,
            zoom: 12
        });

        articles.forEach(article => {
            if (article.locations && article.locations.length > 0) {
                const markersForArticle = [];
                article.locations.forEach((loc, index) => {
                    const marker = new google.maps.Marker({
                        position: loc,
                        map: map, // 초기에는 지도에 추가하되, visible 속성으로 관리
                        title: `${article.title} - ${loc.name}`,
                        icon: ICONS.defaultArticle,
                        visible: false // 초기에는 모든 기사 위치 마커를 숨김
                    });
                    marker.addListener('click', () => handleLocationMarkerClick(article.url, index));
                    markersForArticle.push(marker);
                });
                allArticleMarkers.set(article.url, markersForArticle);
            }
        });
    }

    function clearCurrentArticleMarkers() {
        console.log('Clearing current article markers:', currentArticleMarkers.length);
        currentArticleMarkers.forEach(marker => marker.setMap(null)); // 지도에서 마커 제거
        currentArticleMarkers = []; // 배열 초기화
    }

    function displayMarkersForArticle(articleUrl, highlightLocationIndex = -1) {
        console.log(`Displaying markers for ${articleUrl}, highlighting index ${highlightLocationIndex}`);
        clearCurrentArticleMarkers(); // 이전 마커 지우기

        const markers = allArticleMarkers.get(articleUrl);
        if (markers) {
            console.log(`Found ${markers.length} markers to display.`);
            markers.forEach((marker, index) => {
                marker.setIcon(index === highlightLocationIndex ? ICONS.highlightArticle : ICONS.defaultArticle);
                marker.setMap(map); // 지도에 표시
                currentArticleMarkers.push(marker);
            });
        }
    }

    function panMapToLocation(location) {
        if (map && location) {
            map.panTo(location);
            map.setZoom(14); // 특정 위치로 이동 시 좀 더 확대
        }
    }
    
    function panMapToLocations(locations) {
        if (!map || !locations || locations.length === 0) return;
        if (locations.length === 1) {
            panMapToLocation(locations[0]);
            return;
        }

        const bounds = new google.maps.LatLngBounds();
        locations.forEach(loc => bounds.extend(new google.maps.LatLng(loc.lat, loc.lng)));
        map.fitBounds(bounds);
    }

    function highlightStorageMarker(selectedMarker) {
        storageMarkers.forEach(marker => {
            // A simple way to highlight is to change the icon, but for simplicity, we'll just pan.
            // For a real highlight, you might change the icon color or add an animation.
        });
        // Future enhancement: visually distinguish the selected storage marker.
    }

    function updateStorageMarkers(storages) {
        storageMarkers.forEach(marker => marker.setMap(null));
        storageMarkers = [];

        storages.slice(0, 5).forEach(storage => {
            const position = { lat: storage.location.coordinates[1], lng: storage.location.coordinates[0] };
            const marker = new google.maps.Marker({
                position,
                map: map,
                title: storage.name,
                icon: ICONS.storage
            });
            
            marker.addListener('click', () => {
                panMapToLocation(position);
                highlightStorageMarker(marker);
            });

            storageMarkers.push(marker);
        });
    }

    // --- UI Display & Interaction ---

    function displayNews(articles, sortByLocation = null) {
        if (!articles || articles.length === 0) {
            newsListContainer.innerHTML = '<p class="text-center text-gray-500">표시할 뉴스가 없습니다.</p>';
            return;
        }
        
        // 기사 정렬 (첫 번째 위치 기준)
        if (sortByLocation) {
            articles.forEach(article => {
                if (article.locations && article.locations.length > 0) {
                    article.distance = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(sortByLocation.lat, sortByLocation.lng),
                        new google.maps.LatLng(article.locations[0].lat, article.locations[0].lng)
                    );
                } else {
                    article.distance = Infinity;
                }
            });
            articles.sort((a, b) => a.distance - b.distance);
        }

        newsListContainer.innerHTML = '';
        articles.forEach(article => {
            const card = createNewsCard(article);
            newsListContainer.appendChild(card);
            // allArticleMarkers는 initializeMap에서 이미 설정됨.
            // articleElements 맵은 카드 참조를 저장하는 데 사용.
            const entry = { card: card }; 
            articleElements.set(article.url, entry);
        });
        
        // 첫 번째 카드를 기본값으로 활성화
        if (articles.length > 0) {
            const firstArticle = articles[0];
            // 첫 번째 기사에 위치 정보가 있다면 해당 위치를 활성화
            if (firstArticle.locations && firstArticle.locations.length > 0) {
                handleCardClick(firstArticle.url, false, 0); // 초기 로드 시 스크롤 방지, 첫 번째 위치 하이라이트
            }
        }
    }

    function createNewsCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card bg-white cursor-pointer';
        card.dataset.url = article.url;

        const publishedDate = new Date(article.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        
        let locationTagsHtml = '';
        if (article.locations && article.locations.length > 0) {
            locationTagsHtml = `<div class="mt-2 mb-2 flex flex-wrap gap-1">` +
                article.locations.map((loc, index) => `
                <span class="location-tag inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full cursor-pointer" 
                      data-article-url="${article.url}" data-location-index="${index}" style="white-space: nowrap;">
                    ${loc.name}
                </span>
            `).join('') + `</div>`;
        }
        
        const distanceText = article.distance ? `<span class="text-sm text-gray-500">(${(article.distance / 1000).toFixed(1)}km)</span>` : '';
        const categoryText = `<span class="text-sm font-semibold obangsaek-red">${article.category}</span>`;


        card.innerHTML = `
            <img src="${article.imageUrl || 'https://picsum.photos/seed/news/800/400'}" alt="News Image" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex flex-wrap items-center">
                        ${categoryText} ${distanceText}
                    </div>
                    <span class="text-sm text-gray-500">${publishedDate}</span>
                </div>
                <h2 class="text-2xl font-bold mt-2 mb-2 obangsaek-black">${article.title}</h2>
                ${locationTagsHtml}
                <p class="text-gray-700 mb-4">${article.description}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">자세히 보기 &rarr;</a>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            // 위치 태그 클릭은 별도로 처리하므로, 카드 자체 클릭 시에는 태그 이벤트 전파 방지
            if (e.target.classList.contains('location-tag')) {
                return;
            }
            handleCardClick(article.url);
        });

        // 위치 태그 클릭 이벤트 리스너
        card.querySelectorAll('.location-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const articleUrl = e.target.dataset.articleUrl;
                const locationIndex = parseInt(e.target.dataset.locationIndex, 10);
                handleLocationTagClick(articleUrl, locationIndex);
            });
        });

        return card;
    }

    function displayNearbyStorages(storages) {
        nearbyList.innerHTML = '';
        if (!storages || storages.length === 0) {
            nearbyList.innerHTML = '<p>주변에 등록된 짐보관소가 없습니다.</p>';
            return;
        }

        storages.slice(0, 5).forEach((storage, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'p-4 bg-white rounded-lg shadow-md mb-2 cursor-pointer hover:bg-gray-100';

            let distanceText = `기사 위치에서: ${Math.round(storage.distance)}m`;

            if (currentUserLocation) {
                const storageLocation = {
                    lat: storage.location.coordinates[1],
                    lng: storage.location.coordinates[0]
                };
                const distanceFromUser = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(currentUserLocation.lat, currentUserLocation.lng),
                    new google.maps.LatLng(storageLocation.lat, storageLocation.lng)
                );
                distanceText += ` (내 위치에서: ${(distanceFromUser / 1000).toFixed(1)}km)`;
            }

            listItem.innerHTML = `
                <h3 class="font-bold text-lg">${storage.name}</h3>
                <p class="text-gray-600">${storage.address}</p>
                <p class="text-sm text-blue-600 font-semibold mt-1">${distanceText}</p>
            `;
            
            listItem.addEventListener('click', () => {
                const position = { lat: storage.location.coordinates[1], lng: storage.location.coordinates[0] };
                panMapToLocation(position);
                // The corresponding marker is at the same index in storageMarkers array
                const marker = storageMarkers[index];
                if (marker) {
                    highlightStorageMarker(marker);
                }
            });

            nearbyList.appendChild(listItem);
        });
    }

    // --- Event Handlers ---

    function handleCardClick(articleUrl, shouldScroll = true, highlightLocationIndex = 0) {
        const article = window.newsArticles.find(a => a.url === articleUrl);
        const articleData = articleElements.get(articleUrl);
        if (!article || !articleData || !articleData.card) return;

        // 모든 카드 하이라이트 해제 후 현재 카드 하이라이트
        document.querySelectorAll('.news-card').forEach(card => card.classList.remove('active-news-card'));
        articleData.card.classList.add('active-news-card');

        // 지도에 선택된 기사의 모든 위치 마커 표시 및 특정 위치 하이라이트
        displayMarkersForArticle(articleUrl, highlightLocationIndex);
        
        // 맵 이동 및 주변 짐보관소 업데이트
        const targetLocation = article.locations[highlightLocationIndex] || article.locations[0]; // 기본은 첫 번째 위치
        if (targetLocation) {
            // 주변 목록 제목 업데이트
            const truncatedTitle = article.title.length > 15 ? article.title.substring(0, 15) + '...' : article.title;
            nearbyListTitle.innerHTML = `<span class="font-normal text-gray-500">'${truncatedTitle}' 기사의</span> '${targetLocation.name}' 주변 짐보관소`;

            panMapToLocation(targetLocation);
            fetchStorages(targetLocation).then(storages => {
                updateStorageMarkers(storages);
                displayNearbyStorages(storages);
            });
        }
        
        if (shouldScroll) {
            articleData.card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // 특정 위치 마커 클릭 시
    function handleLocationMarkerClick(articleUrl, locationIndex) {
        const article = window.newsArticles.find(a => a.url === articleUrl);
        if (!article || !article.locations || !article.locations[locationIndex]) return;

        // 해당 기사 카드를 활성화하고 특정 위치를 하이라이트
        handleCardClick(articleUrl, false, locationIndex); 
        
        // 카드 뷰로 스크롤
        const card = document.querySelector(`.news-card[data-url="${articleUrl}"]`);
        if (card) {
             card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // 뉴스 카드 내의 위치 태그 클릭 시
    function handleLocationTagClick(articleUrl, locationIndex) {
        // On mobile, first ensure the map panel is visible
        if (mapPanel && mapPanel.classList.contains('translate-x-full')) {
            mapPanel.classList.remove('translate-x-full');
            // Trigger map resize after the panel is visible to ensure correct rendering
            setTimeout(() => {
                google.maps.event.trigger(map, 'resize');
                // Pan to location *after* the map is resized
                handleCardClick(articleUrl, true, locationIndex);
            }, 300); // Wait for CSS transition to complete
        } else {
            // On desktop or if panel is already visible, just handle the click
            handleCardClick(articleUrl, true, locationIndex);
        }
    }

    function handleFindMyLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                currentUserLocation = userLocation;
                
                if (!userLocationMarker) {
                    userLocationMarker = new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: '내 위치',
                        icon: ICONS.user,
                        zIndex: 1000
                    });
                } else {
                    userLocationMarker.setPosition(userLocation);
                    userLocationMarker.setMap(map);
                }
                
                map.panTo(userLocation);
                map.setZoom(14);
                
                // 사용자 위치 기준으로 뉴스 목록 재정렬 (각 기사의 첫 번째 위치 기준)
                const articles = window.newsArticles; // 전역 변수에서 기사 데이터 가져오기
                displayNews(articles, userLocation);
                
                // Update storages list based on user's location
                const storages = await fetchStorages(userLocation);
                updateStorageMarkers(storages);
                displayNearbyStorages(storages);

            }, () => {
                alert('위치 정보를 가져올 수 없습니다. 브라우저의 위치 정보 접근 권한을 확인해주세요.');
            });
        } else {
            alert('이 브라우저에서는 위치 정보 기능을 사용할 수 없습니다.');
        }
    }
});