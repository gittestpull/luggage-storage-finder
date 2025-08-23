document.addEventListener('DOMContentLoaded', async () => {
    const newsListContainer = document.getElementById('news-list');

    try {
        const response = await fetch('/api/news/entertainment');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newsData = await response.json();

        if (newsData.length === 0) {
            newsListContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">연예 뉴스를 찾을 수 없습니다.</p>';
            return;
        }

        newsListContainer.innerHTML = ''; // 기존 로딩 메시지 제거

        newsData.forEach(newsItem => {
            const newsCard = document.createElement('div');
            newsCard.className = 'bg-white rounded-lg shadow-md p-6';
            newsCard.innerHTML = `
                <h2 class="text-xl font-semibold mb-2">
                    <a href="${newsItem.link}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                        ${newsItem.title}
                    </a>
                </h2>
                <p class="text-gray-600 text-sm mb-3">${newsItem.source} | ${new Date(newsItem.date).toLocaleDateString()}</p>
                <p class="text-gray-700">${newsItem.summary || '요약 없음'}</p>
            `;
            newsListContainer.appendChild(newsCard);
        });

    } catch (error) {
        console.error('뉴스 데이터를 불러오는 데 실패했습니다:', error);
        newsListContainer.innerHTML = '<p class="col-span-full text-center text-red-500">뉴스 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>';
    }
});