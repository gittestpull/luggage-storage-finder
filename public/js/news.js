document.addEventListener('DOMContentLoaded', () => {
    let map;
    let userLocationMarker;
    let storageMarkers = [];
    const articleElements = new Map(); // K: article.url, V: { card, marker }
    let currentUserLocation = null;

    const mapContainer = document.getElementById('mapContainer');
    const nearbyList = document.getElementById('nearby-list');
    const newsListContainer = document.getElementById('news-list');
    const findMyLocationBtn = document.getElementById('find-my-location-btn');

    const ICONS = {
        article: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
        articleHighlight: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        storage: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        user: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
    };

    // --- Initialization ---

    window.initMap = async () => {
        try {
            const articles = await fetchNews();
            initializeMap(articles);
            displayNews(articles);
        } catch (error) {
            console.error(error);
            newsListContainer.innerHTML = '<p class="text-center text-red-500">뉴스 로딩 중 오류가 발생했습니다.</p>';
        }
    };
    
    findMyLocationBtn.addEventListener('click', handleFindMyLocation);

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
        const initialLocation = { lat: 37.5665, lng: 126.9780 }; // Seoul
        map = new google.maps.Map(mapContainer, {
            center: initialLocation,
            zoom: 12
        });

        articles.forEach(article => {
            if (article.location?.lat && article.location?.lng) {
                const marker = new google.maps.Marker({
                    position: article.location,
                    map: map,
                    title: article.title,
                    icon: ICONS.article
                });

                marker.addListener('click', () => handleMarkerClick(article.url));
                articleElements.set(article.url, { marker });
            }
        });
    }

    function highlightMarker(articleUrl) {
        articleElements.forEach((value, key) => {
            if (value.marker) {
                value.marker.setIcon(key === articleUrl ? ICONS.articleHighlight : ICONS.article);
            }
        });
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
            storageMarkers.push(marker);
        });
    }

    // --- UI Display & Interaction ---

    function displayNews(articles, sortByLocation = null) {
        if (!articles || articles.length === 0) {
            newsListContainer.innerHTML = '<p class="text-center text-gray-500">표시할 뉴스가 없습니다.</p>';
            return;
        }

        if (sortByLocation) {
            articles.forEach(article => {
                if (article.location?.lat) {
                    article.distance = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(sortByLocation.lat, sortByLocation.lng),
                        new google.maps.LatLng(article.location.lat, article.location.lng)
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
            if (articleElements.has(article.url)) {
                articleElements.get(article.url).card = card;
            }
        });
        
        // Activate the first card by default
        if (articles.length > 0) {
            handleCardClick(articles[0].url, false); // Don't scroll on initial load
        }
    }

    function createNewsCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card bg-white cursor-pointer';
        card.dataset.url = article.url;

        const publishedDate = new Date(article.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        const distanceText = article.distance ? `<span class="text-sm text-gray-500">(${(article.distance / 1000).toFixed(1)}km)</span>` : '';
        const locationName = article.location?.name ? `<span class="font-bold">[${article.location.name}]</span>` : '';

        card.innerHTML = `
            <img src="${article.imageUrl || 'https://picsum.photos/seed/news/800/400'}" alt="News Image" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-semibold obangsaek-red">${locationName} ${article.category} ${distanceText}</span>
                    <span class="text-sm text-gray-500">${publishedDate}</span>
                </div>
                <h2 class="text-2xl font-bold mt-2 mb-2 obangsaek-black">${article.title}</h2>
                <p class="text-gray-700 mb-4">${article.description}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">자세히 보기 &rarr;</a>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') handleCardClick(article.url);
        });

        return card;
    }

    function displayNearbyStorages(storages) {
        nearbyList.innerHTML = '';
        if (!storages || storages.length === 0) {
            nearbyList.innerHTML = '<p>주변에 등록된 짐보관소가 없습니다.</p>';
            return;
        }

        storages.slice(0, 5).forEach(storage => {
            const listItem = document.createElement('div');
            listItem.className = 'p-4 bg-white rounded-lg shadow-md mb-2';

            let distanceText = `${Math.round(storage.distance)}m`;

            if (currentUserLocation) {
                const storageLocation = {
                    lat: storage.location.coordinates[1],
                    lng: storage.location.coordinates[0]
                };
                const distanceFromUser = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(currentUserLocation.lat, currentUserLocation.lng),
                    new google.maps.LatLng(storageLocation.lat, storageLocation.lng)
                );
                distanceText += ` (내 위치에서 ${(distanceFromUser / 1000).toFixed(1)}km)`;
            }

            listItem.innerHTML = `
                <h3 class="font-bold text-lg">${storage.name}</h3>
                <p class="text-gray-600">${storage.address}</p>
                <p class="text-sm text-blue-600 font-semibold mt-1">${distanceText}</p>
            `;
            nearbyList.appendChild(listItem);
        });
    }

    // --- Event Handlers ---

    function handleCardClick(articleUrl, shouldScroll = true) {
        const articleData = articleElements.get(articleUrl);
        if (!articleData || !articleData.card || !articleData.marker) return;

        // Highlight card
        articleElements.forEach(val => val.card?.classList.remove('active-news-card'));
        articleData.card.classList.add('active-news-card');

        // Highlight marker
        highlightMarker(articleUrl);

        // Pan map and update storages
        const location = articleData.marker.getPosition().toJSON();
        map.panTo(location);
        fetchStorages(location).then(storages => {
            updateStorageMarkers(storages);
            displayNearbyStorages(storages);
        });

        if (shouldScroll) {
            articleData.card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function handleMarkerClick(articleUrl) {
        const articleData = articleElements.get(articleUrl);
        if (!articleData || !articleData.card) return;

        // Defer scroll until after other updates
        setTimeout(() => {
            articleData.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        handleCardClick(articleUrl, false); // handle all other logic, but don't scroll card again
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
                
                // Re-sort news list based on user's location
                const articles = Array.from(articleElements.keys()).map(url => ({
                    url,
                    ...articleElements.get(url)
                }));
                const mappedArticles = articles.map(a => {
                    const articleData = articleElements.get(a.url);
                    return {
                        ...a,
                        title: articleData.marker.getTitle(),
                        location: articleData.marker.getPosition().toJSON()
                    }
                });
                
                const allArticles = await fetchNews();
                displayNews(allArticles, userLocation);
                
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