'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StockMarketData } from '@/lib/stockAnalysis';

interface RelatedStock {
    name: string;
    code: string;
    reason: string;
}

interface NewsArticle {
    _id: string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    source: { name?: string };
    category: 'travel' | 'entertainment' | 'local';
    relatedStocks?: RelatedStock[];
}

interface StockCardProps {
    stock: RelatedStock;
}

const StockCard = ({ stock }: StockCardProps) => {
    const [data, setData] = useState<any>(null); // Use any to match new interface with trends
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/stocks?code=${stock.code}`);
                if (!res.ok) throw new Error('Failed');
                const result = await res.json();
                setData(result);
            } catch (err) {
                // Ignore errors
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [stock.code]);

    // Helper to format large numbers
    const formatVolume = (val: number) => {
        const absVal = Math.abs(val);
        const prefix = val > 0 ? '+' : (val < 0 ? '-' : '');
        if (absVal >= 10000) {
            return `${prefix}${(absVal / 10000).toFixed(1)}만`;
        }
        return `${prefix}${absVal.toLocaleString()}`;
    };

    if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-lg border border-gray-100 p-3">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
    </div>;

    if (!data) return <div className="h-24 bg-red-50 rounded-lg border border-red-100 p-3 flex items-center justify-center text-red-400 text-xs">
        데이터 로딩 실패
    </div>;

    return (
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="font-bold text-gray-800 text-sm">{stock.name}</span>
                    <span className="text-xs text-gray-400 block">{stock.code}</span>
                </div>
                <div className={`text-right ${data.isUp ? 'text-red-500' : 'text-blue-600'}`}>
                    <div className="font-bold text-sm">{data.price.toLocaleString()}원</div>
                    <div className="text-xs">
                        {data.isUp ? '▲' : '▼'} {data.change.toLocaleString()} ({data.changePercent}%)
                    </div>
                </div>
            </div>

            {/* Investment Trends (Supply/Demand) */}
            {data.trends && (
                <div className="flex gap-2 text-[10px] mb-2 bg-white p-1.5 rounded border border-gray-100">
                    <div className="flex items-center gap-1">
                        <span className="text-gray-500">외인</span>
                        <span className={`font-semibold ${data.trends.foreigner > 0 ? 'text-red-500' : 'text-blue-600'}`}>
                            {formatVolume(data.trends.foreigner)}
                        </span>
                    </div>
                    <div className="w-[1px] bg-gray-200"></div>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-500">기관</span>
                        <span className={`font-semibold ${data.trends.institution > 0 ? 'text-red-500' : 'text-blue-600'}`}>
                            {formatVolume(data.trends.institution)}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mt-2">
                <a
                    href={`https://m.stock.naver.com/domestic/stock/${stock.code}/short`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-gray-400 underline hover:text-blue-500"
                >
                    공매도/신용 확인 ↗
                </a>
                <a
                    href={`/stocks/analysis/${stock.code}`}
                    className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                    심층 분석 📊
                </a>
            </div>

            <div className="mt-1 text-xs text-gray-500">
                💡 {stock.reason}
            </div>
        </div>
    );
};

const MarketIndex = ({ name, value, change, changePercent, isUp }: { name: string, value: string, change: string, changePercent: string, isUp: boolean }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 min-w-[150px]">
            <h3 className="text-gray-500 text-sm font-medium mb-1">{name}</h3>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className={`text-sm ${isUp ? 'text-red-500' : 'text-blue-600'}`}>
                {change} ({changePercent})
            </div>
        </div>
    );
};

// Component to fetch and display indices
const MarketIndicesTicker = () => {
    const [indices, setIndices] = useState<any[]>([]);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const res = await fetch('/api/stocks/indices');
                if (res.ok) {
                    const data = await res.json();
                    setIndices(data);
                }
            } catch (e) {
                console.error('Failed to fetch indices', e);
            }
        };

        fetchIndices();
        // Refresh every 60s
        const interval = setInterval(fetchIndices, 60000);
        return () => clearInterval(interval);
    }, []);

    if (indices.length === 0) {
        // Skull placeholder while loading
        return (
            <div className="flex gap-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white/10 animate-pulse h-24 w-40 rounded-xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-2">
            {indices.map((idx) => (
                <MarketIndex
                    key={idx.name}
                    name={idx.name}
                    value={idx.value}
                    change={idx.change}
                    changePercent={idx.changePercent}
                    isUp={idx.isUp}
                />
            ))}
        </div>
    );
};

export default function StocksPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching news:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Banner */}
            <div className="bg-slate-900 text-white pb-12 pt-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">📈 투자 인사이트</h1>
                            <p className="text-slate-400">AI가 분석한 뉴스 기반 관련 주식 정보를 확인하세요.</p>
                        </div>
                        <div className="mt-4 md:mt-0 px-3 py-1 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                            Realtime Data Active
                        </div>
                    </div>

                    {/* Market Indices (Dynamic) */}
                    <MarketIndicesTicker />
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 -mt-8">
                {loading ? (
                    <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">AI가 뉴스를 분석하여 종목을 추출하고 있습니다...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* News Feed Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span>📰</span> 실시간 분석 뉴스
                            </h2>

                            {articles.map((article) => (
                                <div key={article._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium
                                            ${article.category === 'travel' ? 'bg-blue-100 text-blue-700' :
                                                article.category === 'entertainment' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-green-100 text-green-700'}`}>
                                            {article.category === 'travel' ? '여행' :
                                                article.category === 'entertainment' ? '연예' : '지역'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(article.publishedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600">
                                        <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                                    </h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                        {article.description}
                                    </p>

                                    {/* Related Stocks Section for Mobile (Horizontal) */}
                                    <div className="lg:hidden mt-4 pt-4 border-t border-gray-100">
                                        <div className="text-xs font-bold text-slate-500 mb-2">🤖 AI 관련주 추천</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {article.relatedStocks?.map((stock, idx) => (
                                                <StockCard key={idx} stock={stock} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sidebar - Featured Stocks */}
                        <div className="hidden lg:block">
                            <div className="sticky top-24 space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span>🤖</span> AI 추천 종목 하이라이트
                                    </h2>
                                    <p className="text-xs text-gray-500 mb-6">
                                        현재 보고 계신 뉴스 리스트에서 가장 연관성이 높은 종목들입니다.
                                    </p>

                                    {/* Iterate over first few articles to show their stocks in sidebar */}
                                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {articles.slice(0, 5).map((article) => (
                                            article.relatedStocks && article.relatedStocks.length > 0 && (
                                                <div key={`sidebar-${article._id}`} className="mb-6">
                                                    <div className="text-xs font-semibold text-gray-400 mb-2 truncate px-1">
                                                        ↳ {article.title}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {article.relatedStocks.map((stock, idx) => (
                                                            <StockCard key={idx} stock={stock} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg">
                                    <h3 className="font-bold text-lg mb-2">💡 투자 팁</h3>
                                    <p className="text-sm text-blue-100 mb-4">
                                        여행 관련 뉴스가 많을 때는 항공주와 여행사 주식에 주목해보세요.
                                        엔터 뉴스는 신곡 발표 시기에 주가 변동성이 커질 수 있습니다.
                                    </p>
                                    <button className="w-full py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                                        더 알아보기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div >
    );
}
