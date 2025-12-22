'use client';

import { useEffect, useState } from 'react';

interface RecommendedStock {
    _id: string;
    name: string;
    code: string;
    description: string;
    imageUrl?: string;
    additionalInfo?: {
        creditTrend?: string;
        shortSellTrend?: string;
    };
    createdAt: string;
    isAi?: boolean; // Added for UI differentiation
}

export default function RecommendedStocksPage() {
    const [stocks, setStocks] = useState<RecommendedStock[]>([]);
    const [indices, setIndices] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'ai'>('all');

    // Filter stocks based on active tab
    const showAdmin = activeTab === 'all' || activeTab === 'admin';
    const showAi = activeTab === 'all' || activeTab === 'ai';
    const hasAdminStocks = stocks.some(s => !s.isAi);

    useEffect(() => {
        // Fetch Stocks
        fetch('/api/stocks', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStocks(data);
                } else {
                    setStocks([]);
                }
            })
            .catch(err => console.error('Failed to fetch stocks:', err));

        // Fetch Indices
        fetch('/api/indices', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setIndices(data);
            })
            .catch(err => console.error('Failed to fetch indices:', err));

        // Fetch News
        fetch('/api/news', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setNews(data);
            })
            .catch(err => console.error('Failed to fetch news:', err))
            .finally(() => setLoading(false));

    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <section className="bg-gradient-to-r from-green-600 to-teal-700 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">관리자 추천 주식</h1>
                    <p className="text-xl text-green-100">전문적인 분석을 바탕으로 엄선된 종목을 확인해보세요.</p>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">추천 종목을 불러오는 중...</p>
                    </div>
                ) : stocks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow">
                        <p className="text-gray-500">현재 등록된 추천 종목이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        {/* Tab Navigation */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'all'
                                        ? 'bg-gray-900 text-white shadow-md'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    전체보기
                                </button>
                                <button
                                    onClick={() => setActiveTab('admin')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${activeTab === 'admin'
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                                        }`}
                                >
                                    <span>🌟</span> 관리자 추천
                                </button>
                                <button
                                    onClick={() => setActiveTab('ai')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${activeTab === 'ai'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    <span>📰</span> AI 뉴스
                                </button>
                            </div>
                        </div>

                        {/* 1. Admin Recommended Section */}
                        {showAdmin && hasAdminStocks && (
                            <section className="mb-16">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span>🌟</span> 관리자 추천 종목
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {stocks.filter(s => !s.isAi).map((stock) => (
                                        <div key={stock._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group cursor-pointer border border-green-100">
                                            {stock.imageUrl && (
                                                <div className="h-48 overflow-hidden bg-gray-200">
                                                    <img
                                                        src={stock.imageUrl}
                                                        alt={stock.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                                        {stock.name}
                                                    </h3>
                                                    <span className="text-sm font-semibold bg-green-50 text-green-700 px-2 py-1 rounded">
                                                        {stock.code}
                                                    </span>
                                                </div>

                                                <p className="text-gray-600 line-clamp-3 mb-6 flex-1 whitespace-pre-line">
                                                    {stock.description}
                                                </p>

                                                <div className="border-t pt-4 space-y-3">
                                                    {stock.additionalInfo?.creditTrend && (
                                                        <div className="flex items-start gap-2 text-sm">
                                                            <span className="font-semibold text-gray-700 min-w-[70px]">신용 추이:</span>
                                                            <span className="text-gray-600">{stock.additionalInfo.creditTrend}</span>
                                                        </div>
                                                    )}
                                                    {stock.additionalInfo?.shortSellTrend && (
                                                        <div className="flex items-start gap-2 text-sm">
                                                            <span className="font-semibold text-gray-700 min-w-[70px]">공매도 추이:</span>
                                                            <span className="text-gray-600">{stock.additionalInfo.shortSellTrend}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 text-right">
                                                    <a
                                                        href={`https://finance.naver.com/item/main.naver?code=${stock.code}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-green-600 hover:text-green-800 font-semibold"
                                                    >
                                                        네이버 금융 상세 ↗
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. AI News Analysis Section */}
                        {showAi && (
                            <section className="animate-fade-in-up animation-delay-200">
                                {/* Market Indices */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span>📊</span> 주요 지수
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {indices.length > 0 ? indices.map((index) => (
                                            <div key={index.name} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                                <span className="text-sm font-semibold text-gray-600 mb-1">{index.name}</span>
                                                <span className="text-lg font-bold text-gray-900">{index.value}</span>
                                                <span className={`text-sm font-medium ${index.isUp ? 'text-red-500' : 'text-blue-500'}`}>
                                                    {index.change} ({index.changePercent})
                                                </span>
                                            </div>
                                        )) : (
                                            <div className="col-span-full text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                                지수 정보를 불러오는 중...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* News List */}
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span>📰</span> 실시간 AI 뉴스 분석
                                    <span className="text-sm font-normal text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-full">뉴스 기반 자동 추천</span>
                                </h2>

                                <div className="space-y-6">
                                    {news.map((article: any) => (
                                        <div key={article._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded">뉴스</span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(article.publishedAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors mb-3 block"
                                                    >
                                                        {article.title}
                                                    </a>
                                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                        {article.description}
                                                    </p>

                                                    {/* Related Stocks Badges */}
                                                    {article.relatedStocks && article.relatedStocks.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {article.relatedStocks.map((stock: any) => (
                                                                <a
                                                                    key={stock.code}
                                                                    href={`https://finance.naver.com/item/main.naver?code=${stock.code}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg active:scale-95 transition-all cursor-pointer border border-red-100"
                                                                >
                                                                    <span className="font-bold text-sm">{stock.name}</span>
                                                                    <span className="text-xs opacity-75">{stock.code}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Investment Disclaimer */}
                <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                    <p className="text-yellow-800 font-semibold mb-2">⚠️ 투자 유의사항</p>
                    <p className="text-sm text-yellow-700">
                        본 서비스에서 제공하는 정보는 투자 참고용이며, 실제 투자의 책임은 전적으로 투자자 본인에게 있습니다.
                        <br />
                        해당 정보의 정확성이나 완전성을 보장하지 않으며, 이를 근거로 한 투자 결과에 대해 어떠한 법적 책임도 지지 않습니다.
                    </p>
                </div>
            </main>
        </div>
    );
}
