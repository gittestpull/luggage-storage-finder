require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const NewsArticle = require('./src/models/NewsArticle');
const connectDB = require('./src/config/db');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

const getCoordinates = async (query) => {
    // This is a placeholder. In a real application, you would use a geocoding API.
    const locations = {
        "JYP": { lat: 37.52551, lng: 127.05062 },
        "경복궁": { lat: 37.580467, lng: 126.976944 },
        "부산 영화의 전당": { lat: 35.171111, lng: 129.127222 },
    };
    for (const key in locations) {
        if (query.includes(key)) {
            return locations[key];
        }
    }
    return null;
};

const fetchNews = async (category, query) => {
    try {
        const response = await axios.get(NEWS_API_URL, {
            params: {
                q: query,
                apiKey: NEWS_API_KEY,
                language: 'ko',
                sortBy: 'publishedAt',
                pageSize: 10
            }
        });

        const articles = [];
        for (const article of response.data.articles) {
            let location = await getCoordinates(article.title);
            if (!location) {
                // Set a default location if no specific location is found
                location = { lat: 37.5665, lng: 126.9780 }; // Seoul coordinates
            }
            articles.push({
                title: article.title,
                description: article.description,
                url: article.url,
                imageUrl: article.urlToImage,
                publishedAt: new Date(article.publishedAt),
                source: { name: article.source.name },
                category,
                location
            });
        }

        return articles;
    } catch (error) {
        console.error(`Error fetching ${category} news:`, error.message);
        return [];
    }
};

const updateNews = async () => {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected.');

    console.log('Fetching news...');
    const entertainmentNews = await fetchNews('entertainment', 'k-pop');
    const travelNews = await fetchNews('travel', '경복궁');
    const localNews = await fetchNews('local', '부산 국제 영화제');

    const allNews = [...entertainmentNews, ...travelNews, ...localNews];

    if (allNews.length === 0) {
        console.log('No news fetched. Exiting.');
        mongoose.connection.close();
        return;
    }

    console.log(`Fetched ${allNews.length} articles. Saving to database...`);

    for (const articleData of allNews) {
        try {
            await NewsArticle.updateOne({ url: articleData.url }, articleData, { upsert: true });
        } catch (error) {
            console.error(`Error saving article: ${articleData.title}`, error.message);
        }
    }

    console.log('News update complete.');
    mongoose.connection.close();
};

updateNews();