// Mock dependencies before importing the module
jest.mock('axios');
jest.mock('../src/models/NewsArticle', () => ({
  deleteMany: jest.fn().mockResolvedValue(undefined),
  updateOne: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/config/db', () => jest.fn());

const updateNews = require('../update-news');
const NewsArticle = require('../src/models/NewsArticle');
const axios = require('axios');


describe('updateNews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('뉴스 가져오기에 성공하면 기존 기사를 삭제하고 새 기사를 저장해야 합니다', async () => {
    // Arrange
    const mockEntertainmentArticles = [{ title: 'K-Pop News', url: 'http://kpop.com', category: 'entertainment', publishedAt: new Date(), description: 'K-Pop', source: { name: 'K-Pop Source' }, urlToImage: 'http://image.com' }];
    const mockTravelArticles = [{ title: 'Travel News', url: 'http://travel.com', category: 'travel', publishedAt: new Date(), description: 'Travel', source: { name: 'Travel Source' }, urlToImage: 'http://image.com' }];
    const mockLocalArticles = [{ title: 'Local News', url: 'http://local.com', category: 'local', publishedAt: new Date(), description: 'Local', source: { name: 'Local Source' }, urlToImage: 'http://image.com' }];

    axios.get.mockImplementation((url, config) => {
      if (url.includes('newsapi.org')) {
        const query = config.params.q;
        if (query === 'k-pop') {
            return Promise.resolve({ data: { articles: mockEntertainmentArticles } });
        }
        if (query === '경복궁') {
            return Promise.resolve({ data: { articles: mockTravelArticles } });
        }
        if (query === '부산 국제 영화제') {
            return Promise.resolve({ data: { articles: mockLocalArticles } });
        }
      }
      if (url.includes('maps.googleapis.com')) {
        return Promise.resolve({
          data: {
            results: [
              {
                geometry: { location: { lat: 37.5665, lng: 126.9780 } },
                address_components: [
                  { long_name: '서울특별시', types: ['administrative_area_level_1'] }
                ],
              },
            ],
          },
        });
      }
      return Promise.reject(new Error(`Unhandled axios.get call to ${url}`));
    });

    const totalArticles = mockEntertainmentArticles.length + mockTravelArticles.length + mockLocalArticles.length;

    // Act
    await updateNews();

    // Assert
    expect(NewsArticle.deleteMany).toHaveBeenCalledTimes(1);
    expect(NewsArticle.updateOne).toHaveBeenCalledTimes(totalArticles);
  });

  it('뉴스 가져오기에 실패하면 기존 기사를 삭제해서는 안 됩니다', async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error('Network error'));

    // Act
    await updateNews();

    // Assert
    expect(NewsArticle.deleteMany).not.toHaveBeenCalled();
    expect(NewsArticle.updateOne).not.toHaveBeenCalled();
  });
});
