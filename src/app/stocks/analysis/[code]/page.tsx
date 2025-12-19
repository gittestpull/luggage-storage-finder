'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';

interface AnalysisData {
    consensus: {
        opinion: string;
        targetPrice: number;
    } | null;
    disclosures: {
        title: string;
        date: string;
        link: string;
    }[];
    relatedStocks: {
        code: string;
        name: string;
        price: string;
        changePercent: string;
    }[];
    news: {
        title: string;
        date: string;
        summary: string;
        link: string;
        thumbnail?: string;
    }[];
}

export default function StockAnalysisPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const [data, setData] = useState<AnalysisData | null>(null);
    const [news, setNews] = useState<any[]>([]);
    const [selectedNews, setSelectedNews] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                // Fetch Analysis Data
                const res = await fetch(`/api/stocks/analysis?code=${code}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }

                // Fetch News Data (Existing API)
                const newsRes = await fetch(`/api/stocks?code=${code}`);
                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    // Just basic stock data returned here, news might be separate?
                    // Ah, my main /api/stocks returns Price + Trends, but NOT article list.
                    // I need a way to fetch news list.
                    // stockClient.ts has fetchStockNews() but it's not exposed via /api/stocks yet?
                    // Actually, fetchStockInfo does NOT call fetchStockNews.
                    // I need to add News fetching to /api/stocks/analysis or separate endpoint.
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [code]);

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">분석 데이터 로딩 중...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">📊 심층 분석 코너</h1>
                    <p className="text-slate-500">
                        종목 코드: <span className="font-mono bg-slate-200 px-2 py-1 rounded">{code}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Short Selling (Visual) & Consensus */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Short Selling / Credit (KRX Iframe) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h2 className="font-bold text-lg text-slate-800">📉 공매도 종합 현황 (KRX)</h2>
                                <span className="text-xs text-slate-400">한국거래소 실시간 화면</span>
                            </div>
                            <div className="h-[600px] w-full relative">
                                {/* Use KRX Mobile or Desktop URL depending on responsiveness. Mobile URL often blocks iframe. 
                                    Using the URL discovered in curl command: 
                                    https://data.krx.co.kr/comm/srt/srtLoader/index.cmd?screenId=MDCSTAT300&isuCd={code} 
                                    Note: This might be X-Frame-Options blocked. If so, we fallback to link. 
                                    But user asked for "Screenshot style". 
                                */}
                                <iframe
                                    src={`https://data.krx.co.kr/comm/srt/srtLoader/index.cmd?screenId=MDCSTAT300&isuCd=${code}`}
                                    className="w-full h-full border-none"
                                    title="KRX Short Selling"
                                />
                                {/* Overlay for interaction protection if needed, or just let user scroll */}
                            </div>
                        </div>

                        {/* Recent News (Reader Mode Simulation) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="font-bold text-lg text-slate-800 mb-4">📰 주요 뉴스 리더</h2>

                            {selectedNews !== null && data?.news[selectedNews] ? (
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                    <button
                                        onClick={() => setSelectedNews(null)}
                                        className="text-xs text-blue-500 font-bold mb-2 hover:underline"
                                    >
                                        ← 목록으로 돌아가기
                                    </button>
                                    <h3 className="font-bold text-lg text-slate-900 mb-2">{data.news[selectedNews].title.replace(/&quot;/g, '"').replace(/&amp;/g, '&')}</h3>
                                    <p className="text-xs text-slate-400 mb-4">{data.news[selectedNews].date.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5')}</p>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                                        {data.news[selectedNews].summary.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')}...
                                    </p>
                                    <a
                                        href={data.news[selectedNews].link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-4 text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded hover:bg-slate-300 transition-colors"
                                    >
                                        원문 보기 ↗
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {data?.news.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedNews(i)}
                                            className="group cursor-pointer p-3 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-all"
                                        >
                                            <div className="flex gap-4">
                                                {item.thumbnail && (
                                                    <img src={item.thumbnail} alt="" className="w-20 h-14 object-cover rounded bg-slate-200 flex-shrink-0" />
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 mb-1 line-clamp-2">
                                                        {item.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&')}
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        {item.date.slice(4, 6)}.{item.date.slice(6, 8)} {item.date.slice(8, 10)}:{item.date.slice(10, 12)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data?.news || data.news.length === 0) && (
                                        <div className="text-center py-8 text-slate-400 text-sm">관련 뉴스가 없습니다.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Consensus, Disclosure, Related */}
                    <div className="space-y-8">

                        {/* Consensus */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="font-bold text-lg text-slate-800 mb-4">🎯 애널리스트 컨센서스</h2>
                            {data?.consensus ? (
                                <div className="text-center py-6">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">{data.consensus.targetPrice.toLocaleString()}원</div>
                                    <div className="text-sm text-slate-500 mb-4">목표 주가 평균</div>
                                    <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold">
                                        투자의견: {data.consensus.opinion} (4.0 = 매수)
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">컨센서스 데이터 없음</div>
                            )}
                        </div>

                        {/* Disclosures (DART) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="font-bold text-lg text-slate-800 mb-4">📢 최신 전자공시 (DART)</h2>
                            <ul className="space-y-3">
                                {data?.disclosures.map((disc, i) => (
                                    <li key={i} className="text-sm border-b border-slate-100 pb-2 last:border-0 hover:bg-slate-50 p-1 rounded transition-colors">
                                        <a href={disc.link} target="_blank" rel="noopener noreferrer" className="block">
                                            <span className="text-slate-800 block mb-1 truncate">{disc.title}</span>
                                            <span className="text-xs text-slate-400">{disc.date.split('T')[0]}</span>
                                        </a>
                                    </li>
                                ))}
                                {(!data?.disclosures || data.disclosures.length === 0) && (
                                    <li className="text-slate-400 text-sm text-center">최근 공시 없음</li>
                                )}
                            </ul>
                        </div>

                        {/* Related Stocks / ETFs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="font-bold text-lg text-slate-800 mb-4">🔗 관련 종목 / ETF</h2>
                            <div className="space-y-3">
                                {data?.relatedStocks.map((stock, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-slate-50">
                                        <div>
                                            <div className="font-bold text-slate-700">{stock.name}</div>
                                            <div className="text-xs text-slate-400">{stock.code}</div>
                                        </div>
                                        <div className={`text-right font-medium ${stock.changePercent.startsWith('-') ? 'text-blue-500' : 'text-red-500'}`}>
                                            <div>{parseInt(stock.price).toLocaleString()}</div>
                                            <div className="text-xs">{stock.changePercent}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
