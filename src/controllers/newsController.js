const axios = require('axios');
const cheerio = require('cheerio');

// 경고: 웹 스크래핑은 서비스 약관 위반 및 웹사이트 구조 변경 시 작동 중단 가능성이 있습니다.
// 공식 API가 있다면 공식 API를 사용하는 것이 가장 좋습니다.

exports.getEntertainmentNews = async (req, res) => {
    try {
        const news = await scrapeNaverEntertainmentNews();

        // 최신순으로 정렬 (예시: 실제 뉴스에는 날짜 정보가 필요)
        news.sort((a, b) => new Date(b.date) - new Date(a.date)); 

        res.json(news);
    } catch (error) {
        console.error('뉴스 데이터를 가져오는 중 오류 발생:', error);
        res.status(500).json({ message: '뉴스 데이터를 가져오는 데 실패했습니다.' });
    }
};

async function scrapeNaverEntertainmentNews() {
    const url = 'https://entertain.naver.com/home'; // 네이버 연예 뉴스 홈
    const news = [];
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // 예시 셀렉터: 실제 네이버 연예 뉴스 페이지 구조에 따라 변경해야 합니다.
        // 개발자 도구를 사용하여 정확한 셀렉터를 찾아야 합니다.
        $('div.home_section._home_section_entertainment ul.news_list li').each((i, elem) => {
            const title = $(elem).find('.title').text().trim();
            const link = $(elem).find('a').attr('href');
            const summary = $(elem).find('.summary').text().trim();
            // 날짜 정보는 스크래핑 시 포함되어 있지 않을 수 있으므로 현재 시간으로 대체
            const date = new Date().toISOString(); 

            if (title && link) {
                news.push({
                    source: 'Naver',
                    title,
                    link: link.startsWith('http') ? link : `https://entertain.naver.com${link}`,
                    summary,
                    date
                });
            }
        });
    } catch (error) {
        console.error('네이버 연예 뉴스 스크래핑 중 오류:', error.message);
    }
    return news;
}

async function scrapeDaumEntertainmentNews() {
    const url = 'https://entertain.daum.net/ranking'; // 다음 연예 뉴스 랭킹 (예시)
    const news = [];
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // 예시 셀렉터: 실제 다음 연예 뉴스 페이지 구조에 따라 변경해야 합니다.
        // 개발자 도구를 사용하여 정확한 셀렉터를 찾아야 합니다.
        $('ul.list_news li').each((i, elem) => {
            const title = $(elem).find('.tit_thumb a').text().trim();
            const link = $(elem).find('.tit_thumb a').attr('href');
            const summary = $(elem).find('.desc_info').text().trim();
            // 날짜 정보는 스크래핑 시 포함되어 있지 않을 수 있으므로 현재 시간으로 대체
            const date = new Date().toISOString(); 

            if (title && link) {
                news.push({
                    source: 'Daum',
                    title,
                    link: link.startsWith('http') ? link : `https://entertain.daum.net${link}`,
                    summary,
                    date
                });
            }
        });
    } catch (error) {
        console.error('다음 연예 뉴스 스크래핑 중 오류:', error.message);
    }
    return news;
}