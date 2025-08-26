document.addEventListener('DOMContentLoaded', () => {
    let map;
    let currentTargetLocation;
    const mapContainer = document.getElementById('mapContainer');
    const nearbyList = document.getElementById('nearby-list');
    const newsCards = document.querySelectorAll('.news-card-clickable');

    // Function to initialize the map
    window.initMap = () => {
        const firstCard = document.querySelector('.news-card-clickable');
        if (firstCard) {
            const lat = parseFloat(firstCard.dataset.lat);
            const lng = parseFloat(firstCard.dataset.lng);
            currentTargetLocation = { lat, lng };
            showMapForLocation(currentTargetLocation);
        } else {
            // Fallback to Seoul if no news articles are present
            currentTargetLocation = { lat: 37.5665, lng: 126.9780 };
            showMapForLocation(currentTargetLocation);
        }
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
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);

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

    // Add click listeners to news cards
    newsCards.forEach(card => {
        card.addEventListener('click', () => {
            const lat = parseFloat(card.dataset.lat);
            const lng = parseFloat(card.dataset.lng);
            currentTargetLocation = { lat, lng };
            showMapForLocation(currentTargetLocation);
        });
    });
});
