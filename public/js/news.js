document.addEventListener('DOMContentLoaded', () => {
    let map;
    let currentTargetLocation;
    const mapContainer = document.getElementById('mapContainer');
    const nearbyList = document.getElementById('nearby-list');
    const newsList = document.getElementById('news-list');

    // Function to fetch news from the backend
    async function fetchNews() {
        try {
            const response = await fetch('/api/news');
            if (!response.ok) {
                throw new Error('뉴스를 불러오는 데 실패했습니다.');
            }
            const articles = await response.json();
            displayNews(articles);
        } catch (error) {
            console.error(error);
            newsList.innerHTML = '<p class="text-center text-red-500">뉴스 로딩 중 오류가 발생했습니다.</p>';
        }
    }

    // Function to display news articles
    function displayNews(articles) {
        if (!articles || articles.length === 0) {
            newsList.innerHTML = '<p class="text-center text-gray-500">표시할 뉴스가 없습니다.</p>';
            return;
        }

        newsList.innerHTML = ''; // Clear loading message
        articles.forEach(article => {
            const newsCard = createNewsCard(article);
            newsList.appendChild(newsCard);
        });

        // Initialize map with the location of the first article
        const firstArticle = articles[0];
        if (firstArticle.location && firstArticle.location.lat && firstArticle.location.lng) {
            currentTargetLocation = { lat: firstArticle.location.lat, lng: firstArticle.location.lng };
            showMapForLocation(currentTargetLocation);
        } else {
            // Fallback to Seoul if no location is available
            currentTargetLocation = { lat: 37.5665, lng: 126.9780 };
            showMapForLocation(currentTargetLocation);
        }
    }

    // Function to create a news card element
    function createNewsCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card bg-white news-card-clickable';
        if (article.location && article.location.lat && article.location.lng) {
            card.dataset.lat = article.location.lat;
            card.dataset.lng = article.location.lng;
        }

        const publishedDate = new Date(article.publishedAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        card.innerHTML = `
            <img src="${article.imageUrl || 'https://picsum.photos/seed/news/800/400'}" alt="News Image" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-semibold obangsaek-red">${article.category}</span>
                    <span class="text-sm text-gray-500">${publishedDate}</span>
                </div>
                <h2 class="text-2xl font-bold mt-2 mb-2 obangsaek-black">${article.title}</h2>
                <p class="text-gray-700 mb-4">${article.description}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">자세히 보기 &rarr;</a>
            </div>
        `;
        
        if (article.location && article.location.lat && article.location.lng) {
            card.addEventListener('click', () => {
                const lat = parseFloat(card.dataset.lat);
                const lng = parseFloat(card.dataset.lng);
                currentTargetLocation = { lat, lng };
                showMapForLocation(currentTargetLocation);

                                                // Scroll to the map section with a slight delay
                setTimeout(() => {
                    const mapSection = document.getElementById('mapContainer').closest('div.w-full.lg:w-1/3');
                    if (mapSection) {
                        window.scrollTo({
                            top: mapSection.offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }, 300); // 300ms delay
            });
        }

        return card;
    }

    // Function to initialize the map
    window.initMap = () => {
        fetchNews(); // Fetch news, which will then initialize the map
    };

    function showMapForLocation(location) {
        map = new google.maps.Map(mapContainer, {
            center: location,
            zoom: 15
        });

        new google.maps.Marker({
            position: location,
            map: map,
            title: "기사 관련 위치",
        });

        fetchStorages(location);
    }

    // Function to fetch storage locations from the API
    async function fetchStorages(location) {
        try {
            const storages = await api.getStorages();
            if (storages && storages.length > 0) {
                displayNearbyStorages(storages, location);
            } else {
                nearbyList.innerHTML = '<p>주변에 등록된 짐보관소가 없습니다.</p>';
            }
        } catch (error) {
            console.error("짐보관소 정보를 불러오는 데 실패했습니다.", error);
            nearbyList.innerHTML = '<p>정보를 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // Function to display nearby storages
    function displayNearbyStorages(storages, location) {
        const nearbyStorages = storages
            .map(storage => {
                const storageLocation = {
                    lat: storage.location.coordinates[1],
                    lng: storage.location.coordinates[0]
                };
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(location.lat, location.lng),
                    new google.maps.LatLng(storageLocation.lat, storageLocation.lng)
                );
                return { ...storage, distance };
            })
            .sort((a, b) => a.distance - b.distance);

        nearbyList.innerHTML = ''; // Clear previous list

        nearbyStorages.forEach(storage => {
            // Add marker to the map
            new google.maps.Marker({
                position: { lat: storage.location.coordinates[1], lng: storage.location.coordinates[0] },
                map: map,
                title: storage.name
            });

            // Add to the list
            const listItem = document.createElement('div');
            listItem.className = 'p-4 bg-white rounded-lg shadow-md';
            listItem.innerHTML = `
                <h3 class="font-bold text-lg">${storage.name}</h3>
                <p class="text-gray-600">${storage.address}</p>
                <p class="text-sm text-blue-600 font-semibold mt-1">${Math.round(storage.distance)}m</p>
            `;
            nearbyList.appendChild(listItem);
        });
    }
});