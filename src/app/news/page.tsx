'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui';
import GoogleMap, { MARKER_ICONS } from '@/components/maps/GoogleMap';
import Link from 'next/link';

interface NewsLocation {
    name: string;
    lat?: number;
    lng?: number;
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
    locations: NewsLocation[];
}

interface Storage {
    _id: string;
    name: string;
    address: string;
    location: { coordinates: [number, number] };
    is24Hours?: boolean;
    smallPrice?: number;
    distance?: number;
}

interface MapMarker {
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
    onClick?: () => void;
}

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [nearbyStorages, setNearbyStorages] = useState<Storage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
    const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMobileMap, setShowMobileMap] = useState(false);

    useEffect(() => {
        // Fetch news articles
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
                // Select first article by default
                if (data.length > 0 && data[0].locations?.length > 0) {
                    setSelectedArticle(data[0]);
                    const firstLoc = data[0].locations[0];
                    if (firstLoc.lat && firstLoc.lng) {
                        setMapCenter({ lat: firstLoc.lat, lng: firstLoc.lng });
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching news:', err);
                setLoading(false);
            });
    }, []);

    // Fetch nearby storages when selected location changes
    useEffect(() => {
        if (!selectedArticle?.locations?.[selectedLocationIndex]) return;

        const loc = selectedArticle.locations[selectedLocationIndex];
        if (!loc.lat || !loc.lng) return;

        fetch(`/api/storages?latitude=${loc.lat}&longitude=${loc.lng}&radius=10`)
            .then(res => res.json())
            .then(data => {
                // Calculate distance for each storage
                const storagesWithDistance = data.slice(0, 5).map((storage: Storage) => {
                    const storageCoords = storage.location.coordinates;
                    const distance = calculateDistance(
                        loc.lat!, loc.lng!,
                        storageCoords[1], storageCoords[0]
                    );
                    return { ...storage, distance };
                });
                setNearbyStorages(storagesWithDistance);
            })
            .catch(err => console.error('Error fetching storages:', err));
    }, [selectedArticle, selectedLocationIndex]);

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleLocationClick = useCallback((article: NewsArticle, locationIndex: number) => {
        setSelectedArticle(article);
        setSelectedLocationIndex(locationIndex);
        const loc = article.locations[locationIndex];
        if (loc.lat && loc.lng) {
            setMapCenter({ lat: loc.lat, lng: loc.lng });
        }
        // Show map on mobile
        setShowMobileMap(true);
    }, []);

    const handleFindMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setMapCenter({ lat: latitude, lng: longitude });
                },
                () => {
                    alert('위치 정보를 가져올 수 없습니다.');
                }
            );
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'travel': return 'bg-blue-100 text-blue-700';
            case 'entertainment': return 'bg-purple-100 text-purple-700';
            case 'local': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'travel': return '여행';
            case 'entertainment': return '연예';
            case 'local': return '지역';
            default: return category;
        }
    };

    // Build markers for the map
    const buildMapMarkers = (): MapMarker[] => {
        const markers: MapMarker[] = [];

        // Article location markers
        if (selectedArticle?.locations) {
            selectedArticle.locations.forEach((loc, idx) => {
                if (loc.lat && loc.lng) {
                    markers.push({
                        position: { lat: loc.lat, lng: loc.lng },
                        title: loc.name,
                        icon: idx === selectedLocationIndex ? MARKER_ICONS.articleHighlight : MARKER_ICONS.article,
                        onClick: () => handleLocationClick(selectedArticle, idx),
                    });
                }
            });
        }

        // Storage markers
        nearbyStorages.forEach(storage => {
            markers.push({
                position: {
                    lat: storage.location.coordinates[1],
                    lng: storage.location.coordinates[0]
                },
                title: storage.name,
                icon: MARKER_ICONS.storage,
            });
        });

        // User location marker
        if (userLocation) {
            markers.push({
                position: userLocation,
                title: '내 위치',
                icon: MARKER_ICONS.user,
            });
        }

        return markers;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">최신 소식</h1>
                    <p className="text-xl text-blue-100">여행, 연예, 지역의 다양한 소식과 함께 주변 짐보관소를 확인해보세요.</p>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* News Section */}
                    <div className="w-full lg:w-2/3">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">📰 최신 뉴스</h2>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">최신 뉴스를 불러오는 중...</p>
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl shadow">
                                <p className="text-gray-500">등록된 뉴스가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {articles.map((article) => (
                                    <article
                                        key={article._id}
                                        className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer
                                            ${selectedArticle?._id === article._id ? 'ring-2 ring-blue-500' : ''}`}
                                        onClick={() => {
                                            if (article.locations?.length > 0) {
                                                handleLocationClick(article, 0);
                                            }
                                        }}
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {article.imageUrl && (
                                                <div className="md:w-1/3 h-48 md:h-auto">
                                                    <img
                                                        src={article.imageUrl}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            )}
                                            <div className={`p-6 flex flex-col justify-between ${article.imageUrl ? 'md:w-2/3' : 'w-full'}`}>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(article.category)}`}>
                                                            {getCategoryLabel(article.category)}
                                                        </span>
                                                        {article.source?.name && (
                                                            <span className="text-xs text-gray-500">{article.source.name}</span>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-gray-600 line-clamp-2 mb-4">{article.description}</p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-wrap gap-2">
                                                        {article.locations?.map((loc, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLocationClick(article, idx);
                                                                }}
                                                                className={`text-xs px-2 py-1 rounded-full transition-colors
                                                                    ${selectedArticle?._id === article._id && selectedLocationIndex === idx
                                                                        ? 'bg-blue-500 text-white'
                                                                        : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700'}`}
                                                            >
                                                                📍 {loc.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        자세히 보기 →
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Map & Nearby Storages */}
                    <aside className={`w-full lg:w-1/3 ${showMobileMap ? 'fixed inset-0 z-50 bg-white p-4 lg:relative lg:p-0' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                            {/* Mobile close button */}
                            <button
                                className="lg:hidden absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                                onClick={() => setShowMobileMap(false)}
                            >
                                ✕
                            </button>

                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">🗺️ 지도 & 주변 정보</h2>
                                <button
                                    onClick={handleFindMyLocation}
                                    className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                >
                                    📍 내 위치
                                </button>
                            </div>

                            {/* Google Map */}
                            <GoogleMap
                                center={mapCenter}
                                zoom={14}
                                markers={buildMapMarkers()}
                                selectedMarkerIndex={selectedLocationIndex}
                                className="h-64 lg:h-80 mb-6"
                            />

                            {/* Selected Location Info */}
                            {selectedArticle && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">'{selectedArticle.title.substring(0, 20)}...'</span> 기사의
                                    </p>
                                    <p className="text-blue-700 font-bold">
                                        '{selectedArticle.locations[selectedLocationIndex]?.name}' 주변
                                    </p>
                                </div>
                            )}

                            {/* Storage List */}
                            <h3 className="text-lg font-bold text-gray-900 mb-3">🏪 주변 짐보관소</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {nearbyStorages.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">기사 위치를 선택하세요</p>
                                ) : (
                                    nearbyStorages.map((storage) => (
                                        <div
                                            key={storage._id}
                                            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                                        >
                                            <h4 className="font-medium text-gray-900">{storage.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{storage.address}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {storage.is24Hours && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">24시간</span>
                                                )}
                                                {storage.distance && (
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        {storage.distance < 1
                                                            ? `${Math.round(storage.distance * 1000)}m`
                                                            : `${storage.distance.toFixed(1)}km`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Link href="/" className="block mt-6">
                                <Button variant="outline" className="w-full">
                                    더 많은 보관소 찾기
                                </Button>
                            </Link>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Mobile FAB for showing map */}
            <button
                className="lg:hidden fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg z-40"
                onClick={() => setShowMobileMap(true)}
            >
                🗺️
            </button>
        </div>
    );
}
