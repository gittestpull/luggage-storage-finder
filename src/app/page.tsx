'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { StorageLocation } from '@/types';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [storages, setStorages] = useState<StorageLocation[]>([]);
  const [premiumStorages, setPremiumStorages] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { openModal } = useAuth(); // modals, closeModal 미사용 제거

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  // selectedStorage 등은 지도 인터랙션에 필요
  const [selectedStorage, setSelectedStorage] = useState<StorageLocation | null>(null);
  // editStorage 사용 여부 확인 필요하지만 일단 유지

  // Handle scroll for header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/storages', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setStorages(data);
      })
      .catch(err => console.error('Error loading storages:', err));

    fetch('/api/storages/premium', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setPremiumStorages(data))
      .catch(err => console.error('Error loading premium:', err));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && !mapRef.current) {
      initMap();
    } else if (!window.initMap) {
      window.initMap = initMap;
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && (storages.length > 0 || userLocation)) {
      updateMarkers();
    }
  }, [storages, userLocation, selectedStorage]);

  const initMap = () => {
    const mapOptions = {
      center: { lat: 37.5665, lng: 126.9780 },
      zoom: 13,
      styles: [
        { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -10 }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    };
    const mapDiv = document.getElementById('mapContainer');
    if (mapDiv) {
      mapRef.current = new window.google.maps.Map(mapDiv, mapOptions);
      updateMarkers();
    }
  };

  const updateMarkers = () => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    const bounds = new window.google.maps.LatLngBounds();

    storages.forEach(storage => {
      if (storage.location && storage.location.coordinates) {
        const [lng, lat] = storage.location.coordinates;
        if (lat === 0 && lng === 0) return;

        const isSelected = selectedStorage?._id === storage._id;
        const markerColor = isSelected ? '#ef4444' : (storage.isPremium ? '#f59e0b' : '#6366f1');

        const pinSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="${markerColor}" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="14" r="6" fill="white"/>
          </svg>
        `;

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          title: storage.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg),
            scaledSize: new window.google.maps.Size(isSelected ? 40 : 32, isSelected ? 50 : 40),
            anchor: new window.google.maps.Point(isSelected ? 20 : 16, isSelected ? 50 : 40),
          },
          zIndex: isSelected ? 100 : 1,
        });

        const directionsUrl = userLocation
          ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-4 min-w-[220px] font-sans">
              <h3 class="text-base font-bold text-gray-900 mb-1">${storage.name}</h3>
              <p class="text-xs text-gray-500 mb-2 line-clamp-2">${storage.address}</p>
              ${storage.phoneNumber ? `<p class="text-xs text-indigo-600 mb-3">📞 ${storage.phoneNumber}</p>` : ''}
              <a href="${directionsUrl}" target="_blank" 
                 class="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors no-underline text-center w-full">
                🧭 길찾기
              </a>
            </div>
          `
        });

        marker.addListener('click', () => {
          setSelectedStorage(storage);
          infoWindow.open(mapRef.current, marker);
        });
        markersRef.current.push(marker);
        bounds.extend({ lat, lng });
      }
    });

    if (userLocation) {
      bounds.extend(userLocation);
      if (!userMarkerRef.current || !userMarkerRef.current.getMap()) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: userLocation,
          map: mapRef.current,
          title: '내 위치',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 999,
        });

        const userInfoWindow = new window.google.maps.InfoWindow({
          content: '<div class="p-2 font-bold text-red-500">📍 내 위치</div>'
        });
        userMarkerRef.current.addListener('click', () => userInfoWindow.open(mapRef.current, userMarkerRef.current));
      }
    }

    if (userLocation) {
      // 이미 줌과 센터는 사용자 액션에 따라 제어되므로 여기서 강제하지 않음
      // 단, 처음 로드 시에는 필요할 수 있음
    } else if (storages.length > 0 && !mapRef.current.getCenter()) {
      mapRef.current.fitBounds(bounds);
    }
  };

  const goToMapLocation = (storage: StorageLocation) => {
    setSelectedStorage(storage); // 상태 업데이트로 마커 색상 변경 트리거

    if (!storage.location?.coordinates) return;
    const [lng, lat] = storage.location.coordinates;
    if (lat === 0 && lng === 0) return;

    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
        mapRef.current.setZoom(16);

        // InfoWindow 열기
        const marker = markersRef.current.find(m => m.getTitle() === storage.name);
        if (marker) {
          window.google.maps.event.trigger(marker, 'click');
        }
      }
    }, 500);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/storages?searchQuery=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setStorages(data);
      document.getElementById('list')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocatingUser(false);
        setUserLocation(loc);
        document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });

        // 지도 중심 이동
        if (mapRef.current) {
          mapRef.current.setCenter(loc);
          mapRef.current.setZoom(15);
        }
      },
      (error) => {
        setLocatingUser(false);
        console.error('위치 정보 오류:', error);
        alert('위치 정보를 가져올 수 없습니다.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const faqItems = [
    { q: '서비스 이용은 무료인가요?', a: '네, 짐보관소 정보를 검색하고 확인하는 모든 기능은 완전히 무료입니다.' },
    { q: '짐보관소 정보가 실제와 다를 경우 어떻게 하나요?', a: '제보하기 기능을 통해 수정 제보를 해주시거나, 문의하기를 통해 알려주시면 신속하게 반영합니다.' },
    { q: '제보를 하면 어떤 혜택이 있나요?', a: '새로운 짐보관소를 제보하여 관리자의 승인을 받으면 소정의 포인트를 지급해 드립니다.' },
    { q: '회원가입 시 수집된 개인정보는 안전하게 관리되나요?', a: '네, 저희는 이용자의 개인정보를 매우 중요하게 생각하며, 관련 법령에 따라 안전하게 관리합니다.' },
  ];

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&callback=initMap`}
        strategy="afterInteractive"
      />

      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden bg-gray-900 isolate">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] opacity-50 z-0"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium mb-6 animate-fade-in-up">
            <span>✨</span>
            <span>가장 쉬운 짐보관 찾기 서비스</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-6 animate-fade-in-up animation-delay-200">
            여행의 짐,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
              편하게 보관하세요
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
            전국 모든 짐보관소를 한번에 검색하고,<br />
            가벼운 마음으로 여행을 즐기세요.
          </p>

          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-fade-in-up animation-delay-400">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="지역, 역, 관광지 이름으로 검색..."
              className="flex-1 bg-transparent border-none text-white placeholder-gray-400 px-4 py-3 focus:outline-none text-lg"
            />

            <button
              onClick={getUserLocation}
              disabled={locatingUser}
              className="p-3 text-gray-400 hover:text-yellow-400 hover:bg-white/5 rounded-xl transition-all"
              title="내 위치 찾기"
            >
              {locatingUser ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <span className="text-2xl">🎯</span>
              )}
            </button>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>

          <div className="mt-8">
            <button
              onClick={() => (window as any).requestPushPermission?.()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium backdrop-blur-sm"
            >
              <span>🔔</span>
              <span>새로운 보관소 알림 받기</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Search Bar - Glassmorphism */}
      {isScrolled && (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl animate-fade-in-up">
          <div className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="어디로 가시나요?"
              className="flex-1 bg-transparent border-none px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none text-sm font-medium"
            />

            <button
              onClick={getUserLocation}
              disabled={locatingUser}
              className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
            >
              {locatingUser ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>
              ) : (
                <span>🎯</span>
              )}
            </button>

            <button
              onClick={handleSearch}
              className="p-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">

        {/* Premium Section */}
        <section id="premium">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">⭐ 프리미엄 짐보관소</h2>
            <p className="text-gray-600">검증된 시설에서 안전하게 보관하세요.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumStorages.map((storage) => (
              <div
                key={storage._id}
                onClick={() => goToMapLocation(storage)}
                className="group relative bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-6xl">⭐</span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">{storage.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{storage.address}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {storage.is24Hours && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">24시간</span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">프리미엄</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-amber-600 font-bold text-sm">자세히 보기 &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
            {premiumStorages.length === 0 && (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500">등록된 프리미엄 보관소가 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* List Section */}
        <section id="list">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🗄️ 검색 결과</h2>
              <p className="text-gray-500 mt-1">총 <span className="font-bold text-blue-600">{storages.length}</span>개의 보관소를 찾았습니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {storages.length > 0 ? (
              storages.map(storage => (
                <div
                  key={storage._id}
                  onClick={() => goToMapLocation(storage)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">{storage.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 truncate">{storage.address}</p>

                  <div className="flex flex-wrap gap-2">
                    {storage.is24Hours && <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded font-medium">24h</span>}
                    {storage.smallPrice && <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium">소형 ₩{storage.smallPrice.toLocaleString()}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-500">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </div>
        </section>

        {/* Map Section */}
        <section id="map" className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm">🗺️ 지도 보기</h3>
            </div>
          </div>

          <div id="mapContainer" className="w-full h-full bg-gray-100"></div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">자주 묻는 질문</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-blue-200 transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-blue-600 font-bold">Q.</span>
                    {item.q}
                  </span>
                  <span className={`transform transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                {openFaq === i && (
                  <div className="p-5 pt-0 bg-gray-50/50 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    <div className="pt-4 flex gap-3">
                      <span className="text-green-600 font-bold">A.</span>
                      {item.a}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact/Report Section */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">새로운 짐보관소를 알고 계신가요?</h2>
            <p className="text-blue-100 mb-8 text-lg">여러분의 제보가 여행자들에게 큰 도움이 됩니다.</p>
            <button
              onClick={() => openModal('report')}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              ✍️ 제보하기
            </button>
          </div>

          {/* Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </section>

      </main>
    </>
  );
}
