async function loadPremiumStorages() {
    const premiumList = document.getElementById('premium-list');
    if (!premiumList) return;

    try {
        const response = await fetch('/api/storages/premium');
        if (!response.ok) {
            throw new Error('프리미엄 짐보관소 정보를 불러오지 못했습니다.');
        }
        const premiumStorages = await response.json();

        premiumList.innerHTML = ''; // 기존 목록 비우기

        if (premiumStorages.length > 0) {
            premiumStorages.forEach(storage => {
                const premiumCard = createStorageCard(storage); // 기존 함수 재활용
                premiumCard.classList.add('border-2', 'border-yellow-400'); // 프리미엄 강조
                premiumList.appendChild(premiumCard);
            });
        } else {
            premiumList.innerHTML = '<p class="text-gray-500 col-span-full">추천 짐보관소가 없습니다.</p>';
        }
    } catch (error) {
        console.error('프리미엄 짐보관소 로드 실패:', error);
        premiumList.innerHTML = '<p class="text-red-500 col-span-full">정보를 불러오는 데 실패했습니다.</p>';
    }
}
