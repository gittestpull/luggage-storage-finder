"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

interface Place {
    _id: string;
    name: string;
    address: string;
    description: string;
    location?: {
        type: string;
        coordinates: [number, number];
    };
}

declare global {
    interface Window {
        google: any;
        initPlacesMap?: () => void;
    }
}

export default function PlacesPage() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqItems = [
        { q: '서비스 이용은 무료인가요?', a: '네, 짐보관소 정보를 검색하고 확인하는 모든 기능은 완전히 무료입니다.' },
        { q: '짐보관소 정보가 실제와 다를 경우 어떻게 하나요?', a: '제보하기 기능을 통해 수정 제보를 해주시거나, 문의하기를 통해 알려주시면 신속하게 반영합니다.' },
        { q: '제보를 하면 어떤 혜택이 있나요?', a: '새로운 짐보관소를 제보하여 관리자의 승인을 받으면 소정의 포인트를 지급해 드립니다.' },
        { q: '회원가입 시 수집된 개인정보는 안전하게 관리되나요?', a: '네, 저희는 이용자의 개인정보를 매우 중요하게 생각하며, 관련 법령에 따라 안전하게 관리합니다.' },
    ];

    useEffect(() => {
        const fetchPlaces = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/places');
                const data = await res.json();
                if (data.success) {
                    setPlaces(data.data);
                }
            } catch (error) {
                console.error('Error fetching places:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaces();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.google && !mapRef.current) {
            initMap();
        } else if (!window.initPlacesMap) {
            window.initPlacesMap = initMap;
        }
    }, []);

    useEffect(() => {
        if (mapRef.current && places.length > 0) {
            updateMarkers();
        }
    }, [places]);

    const initMap = () => {
        const mapDiv = document.getElementById('placesMapContainer');
        if (mapDiv) {
            mapRef.current = new window.google.maps.Map(mapDiv, {
                center: { lat: 37.5665, lng: 126.9780 },
                zoom: 13,
                styles: [
                    { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -10 }] },
                    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                ],
            });
            updateMarkers();
        }
    };

    const updateMarkers = () => {
        if (!mapRef.current) return;

        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        const bounds = new window.google.maps.LatLngBounds();

        places.forEach(place => {
            if (place.location && place.location.coordinates) {
                const [lng, lat] = place.location.coordinates;
                if (lat === 0 && lng === 0) return;

                const marker = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: mapRef.current,
                    title: place.name,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#14b8a6',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    },
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 12px; font-family: Inter, sans-serif; min-width: 200px;">
                            <h3 style="font-weight: 700; margin-bottom: 8px; color: #1f2937;">🍽️ ${place.name}</h3>
                            <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">${place.address}</p>
                            ${place.description ? `<p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">${place.description}</p>` : ''}
                            <a 
                                href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
                                target="_blank"
                                style="
                                    display: block;
                                    text-align: center;
                                    background-color: #14b8a6;
                                    color: white;
                                    padding: 8px 12px;
                                    border-radius: 6px;
                                    text-decoration: none;
                                    font-size: 13px;
                                    font-weight: 500;
                                    margin-top: 8px;
                                "
                            >
                                🗺️ 길찾기
                            </a>
                        </div>
                    `
                });

                marker.addListener('click', () => infoWindow.open(mapRef.current, marker));
                markersRef.current.push(marker);
                bounds.extend({ lat, lng });
            }
        });

        if (markersRef.current.length > 0) {
            mapRef.current.fitBounds(bounds);
        }
    };

    const goToMapLocation = (place: Place) => {
        if (!place.location?.coordinates) return;
        const [lng, lat] = place.location.coordinates;
        if (lat === 0 && lng === 0) return;

        document.getElementById('placesMap')?.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.setCenter({ lat, lng });
                mapRef.current.setZoom(16);

                const marker = markersRef.current.find(m => m.getTitle() === place.name);
                if (marker) {
                    window.google.maps.event.trigger(marker, 'click');
                }
            }
        }, 500);
    };

    return (
        <>
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&loading=async&callback=initPlacesMap`}
                strategy="afterInteractive"
            />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-2">🍽️ 가볼만한 곳</h1>
                <p className="text-gray-600 mb-8">사용자들이 추천하는 맛집과 카페를 확인해보세요</p>

                {/* 지도 섹션 */}
                <section id="placesMap" className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">📍 지도로 보기</h2>
                    <div
                        id="placesMapContainer"
                        style={{
                            height: '400px',
                            borderRadius: '16px',
                            background: '#e5e7eb',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                            지도를 불러오는 중...
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        🔵 청록색 마커: 맛집/카페
                    </p>
                </section>

                {/* 장소 리스트 */}
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : places.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-700">등록된 장소가 없습니다</h3>
                        <p className="text-gray-500 mt-2">맛집이나 카페를 제보해주세요!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {places.map(place => (
                            <div
                                key={place._id}
                                className="border border-gray-200 p-5 rounded-xl hover:shadow-lg transition-shadow cursor-pointer bg-white"
                                onClick={() => goToMapLocation(place)}
                            >
                                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                                    🍽️ {place.name}
                                </h2>
                                <p className="text-gray-600 text-sm mb-2">📍 {place.address}</p>
                                {place.description && (
                                    <p className="text-gray-500 text-sm">{place.description}</p>
                                )}
                                <p className="text-xs text-teal-600 mt-3">클릭하여 지도에서 보기</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* FAQ Section */}
                <section id="faq" className="mt-16 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-center">❓ 자주 묻는 질문</h2>
                    <p className="text-gray-600 mb-8 text-center text-sm">
                        궁금하신 점을 빠르게 확인하세요
                    </p>
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqItems.map((item, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <span className="font-medium text-gray-800">Q. {item.q}</span>
                                    <svg
                                        className={`w-5 h-5 text-gray-500 transform transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openFaq === i && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                                        A. {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
