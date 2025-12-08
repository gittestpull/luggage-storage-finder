'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import AiModal from '@/components/modals/AiModal';
import EditRequestModal from '@/components/modals/EditRequestModal';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { openModal, modals, closeModal } = useAuth();

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [editStorage, setEditStorage] = useState<StorageLocation | null>(null);

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
        console.log('Loaded storages:', data.length);
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
    if (mapRef.current && storages.length > 0) {
      updateMarkers();
    }
  }, [storages]);

  const initMap = () => {
    const mapOptions = {
      center: { lat: 37.5665, lng: 126.9780 },
      zoom: 13,
      styles: [
        { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -10 }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
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

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          title: storage.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: storage.isPremium ? '#f59e0b' : '#6366f1',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; font-family: Inter, sans-serif; min-width: 200px;">
              <h3 style="font-weight: 700; margin-bottom: 8px; color: #1f2937;">${storage.name}</h3>
              <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">${storage.address}</p>
              ${storage.phoneNumber ? `<p style="font-size: 13px; color: #6366f1; margin-bottom: 8px;">📞 ${storage.phoneNumber}</p>` : ''}
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
                target="_blank"
                style="
                  display: block;
                  text-align: center;
                  background-color: #3b82f6;
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

    if (storages.length > 0) {
      mapRef.current.fitBounds(bounds);
    }
  };

  // 카드 클릭 시 지도로 이동하고 해당 위치 표시
  const goToMapLocation = (storage: StorageLocation) => {
    if (!storage.location?.coordinates) return;
    const [lng, lat] = storage.location.coordinates;
    if (lat === 0 && lng === 0) return;

    // 지도 섹션으로 스크롤
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });

    // 잠시 후 지도 중심 이동 및 줌
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
        mapRef.current.setZoom(16);

        // 해당 마커의 InfoWindow 열기
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

  // 내 위치 찾기 함수
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
        setUserLocation(loc);
        setLocatingUser(false);

        if (mapRef.current) {
          // 지도 중심을 내 위치로 이동
          mapRef.current.setCenter(loc);
          mapRef.current.setZoom(15);

          // 기존 내 위치 마커 제거
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
          }

          // 새 마커 생성 (내 위치: 초록색)
          userMarkerRef.current = new window.google.maps.Marker({
            position: loc,
            map: mapRef.current,
            title: '내 위치',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 14, // 크기 약간 확대
              fillColor: '#22c55e', // 초록색으로 변경
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 4,
            },
            zIndex: 999,
          });

          // 내 위치 정보창
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: Inter, sans-serif;">
                <h3 style="font-weight: 700; color: #3b82f6; margin-bottom: 4px;">📍 내 위치</h3>
                <p style="font-size: 12px; color: #6b7280;">현재 위치입니다</p>
              </div>
            `,
          });
          userMarkerRef.current.addListener('click', () => infoWindow.open(mapRef.current, userMarkerRef.current));
        }
      },
      (error) => {
        setLocatingUser(false);
        console.error('위치 정보 오류:', error);
        alert('위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 접근 권한을 확인해주세요.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const openEditModal = (storage: StorageLocation) => {
    setEditStorage(storage);
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
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title animate-fade-in-up">
            여행의 짐,<br />
            <span>편하게 보관하세요</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up animation-delay-200">
            전국 짐보관소 정보를 한곳에서 검색하세요
          </p>

          <div className="search-container animate-fade-in-up animation-delay-300">
            <div className="search-box">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="지역, 역, 관광지 이름으로 검색"
                className="search-input"
              />
              <button onClick={handleSearch} disabled={loading} className="search-button">
                {loading ? (
                  <span>검색 중...</span>
                ) : (
                  <>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    검색
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => (window as any).requestPushPermission ? (window as any).requestPushPermission() : alert('잠시만 기다려주세요. 기능이 로딩 중입니다.')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group relative"
              >
                <span className="text-yellow-300">🔔</span>
                <span>새로운 보관소 알림 받기</span>
                {/* 툴팁 (모바일 숨김) */}
                <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  새로운 짐보관소 정보가 업데이트되면 알려드려요!
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </button>
            </div>
          </div>

          <div className="stats-grid animate-fade-in-up animation-delay-400">
            <div className="stat-item">
              <div className="stat-number">{storages.length > 0 ? storages.length.toLocaleString() : '...'}</div>
              <div className="stat-label">등록된 보관소</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24시간</div>
              <div className="stat-label">언제든 검색</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">무료</div>
              <div className="stat-label">검색 서비스</div>
            </div>
          </div>
        </div>
      </section>

      {/* 고정 검색바 (스크롤 시 따라옴) */}
      {isScrolled && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '6px', // 간격 축소 (8px -> 6px)
          padding: '8px 10px', // 패딩 축소 (12px -> 10px)
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '50px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          maxWidth: '600px',
          width: 'calc(100% - 24px)', // 여백 확보
        }}>
          <input
            type="text"
            placeholder="지역 또는 역 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '10px 12px', // 입력창 패딩 축소
              border: 'none',
              background: '#f3f4f6',
              borderRadius: '25px',
              fontSize: '14px',
              outline: 'none',
              color: '#1f2937', // 텍스트 색상 명시 (가독성 향상)
            }}
          />

          {/* 내 위치 버튼 (고정 검색바) */}
          <div className="relative group">
            <button
              onClick={getUserLocation}
              disabled={locatingUser}
              style={{
                padding: '8px', // 버튼 패딩 축소
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                minWidth: '36px', // 최소 너비 확보
                minHeight: '36px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              {locatingUser ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <span style={{ fontSize: '18px' }}>🎯</span>
              )}
            </button>
            {/* 툴팁 (모바일 숨김) */}
            <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              내 위치 찾기
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>

          {/* 검색 버튼 (고정 검색바) */}
          <div className="relative group">
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '8px 16px', // 검색 버튼 패딩 축소 (20px -> 16px)
                background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
                border: 'none',
                borderRadius: '25px',
                color: '#18181b',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              🔍
            </button>
            {/* 툴팁 (모바일 숨김) */}
            <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              검색하기
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>

          {/* 알림 버튼 (고정 검색바) */}
          <div className="relative group">
            <button
              onClick={() => (window as any).requestPushPermission ? (window as any).requestPushPermission() : alert('잠시만 기다려주세요.')}
              style={{
                padding: '10px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🔔
            </button>
            {/* 툴팁 (모바일 숨김) */}
            <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              알림 설정
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Premium Section */}
        <section id="premium" className="section">
          <h2 className="section-title">⭐ 추천 짐보관소</h2>
          <p className="section-subtitle">
            검증된 프리미엄 짐보관소에서 안전하게 보관하세요
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {premiumStorages.map((storage) => (
              <div
                key={storage._id}
                className="card card-premium"
                onClick={() => goToMapLocation(storage)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="card-title">{storage.name}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(storage); }}
                    style={{ fontSize: '12px', padding: '4px 8px', background: '#f3f4f6', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                  >
                    ✏️ 수정
                  </button>
                </div>
                <p className="card-address">{storage.address}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {storage.is24Hours && <span className="tag tag-24h">🕐 24시간</span>}
                  {storage.smallPrice && <span className="tag tag-small">소형 ₩{storage.smallPrice.toLocaleString()}</span>}
                  {storage.largePrice && <span className="tag tag-large">대형 ₩{storage.largePrice.toLocaleString()}</span>}
                </div>
                {storage.phoneNumber && (
                  <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6366f1' }}>
                    📞 {storage.phoneNumber}
                  </p>
                )}
              </div>
            ))}
            {premiumStorages.length === 0 && (
              <p style={{ color: '#9ca3af', textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>
                프리미엄 짐보관소 정보를 불러오는 중...
              </p>
            )}
          </div>
        </section>

        {/* Tips Section */}
        <section id="about-service" className="section" style={{ background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: 'var(--radius-2xl)', margin: '2rem 0' }}>
          <h2 className="section-title">💡 짐보관 꿀팁</h2>
          <p className="section-subtitle">
            여행을 더 가볍게 만들어줄 유용한 정보들
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '📅', title: '예약 가능 여부 확인', desc: '인기 있는 지역의 짐보관소는 미리 예약이 필요할 수 있어요. 방문 전 확인하세요.' },
              { icon: '📦', title: '보관 물품 규정 확인', desc: '보관소마다 물품 종류와 크기, 무게 제한이 다를 수 있어요. 특히 귀중품은 사전 문의하세요.' },
              { icon: '🕐', title: '운영 시간 확인', desc: '24시간 운영되지 않는 곳이 많으니 운영 시간을 반드시 확인하세요.' },
              { icon: '💰', title: '요금 체계 확인', desc: '시간/일 단위 등 요금 체계가 다양해요. 장기 보관 할인도 확인해보세요.' },
            ].map((tip, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{tip.icon}</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1f2937' }}>{tip.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.6' }}>{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Map Section */}
        <section id="map" className="section">
          <h2 className="section-title">📍 지도로 찾기</h2>
          <p className="section-subtitle">
            내 주변 짐보관소를 지도에서 한눈에 확인하세요
          </p>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={getUserLocation}
              disabled={locatingUser}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {locatingUser ? (
                <>
                  <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
                  위치 확인 중...
                </>
              ) : (
                <>
                  📍 내 위치 찾기
                </>
              )}
            </button>
            {userLocation && (
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#3b82f6', fontWeight: 500 }}>
                ✓ 현재 위치가 지도에 표시되어 있습니다
              </span>
            )}
          </div>
          <div id="mapContainer" className="map-container" style={{ height: '500px', background: '#e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
              지도를 불러오는 중...
            </div>
          </div>
        </section>

        {/* Storage List Section */}
        <section id="list" className="section">
          <h2 className="section-title">📋 짐보관소 리스트</h2>
          <p className="section-subtitle">
            총 {storages.length}개의 짐보관소가 검색되었습니다
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {storages.length > 0 ? (
              storages.map((storage) => (
                <div
                  key={storage._id}
                  className="card"
                  onClick={() => goToMapLocation(storage)}
                  style={{ cursor: 'pointer' }}
                  title="클릭하면 지도에서 위치를 확인할 수 있어요"
                >
                  <h3 className="card-title">{storage.name}</h3>
                  <p className="card-address">{storage.address}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {storage.is24Hours && <span className="tag tag-24h">🕐 24시간</span>}
                    {storage.isPremium && <span className="tag" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e' }}>⭐ 프리미엄</span>}
                    {storage.smallPrice && <span className="tag tag-small">소형 ₩{storage.smallPrice.toLocaleString()}</span>}
                    {storage.largePrice && <span className="tag tag-large">대형 ₩{storage.largePrice.toLocaleString()}</span>}
                  </div>
                  {storage.phoneNumber && (
                    <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6366f1' }}>
                      📞 {storage.phoneNumber}
                    </p>
                  )}
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>📍 클릭하여 지도에서 보기</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditStorage(storage);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    >
                      ✏️ 정보 수정 요청
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>검색 결과가 없습니다</p>
                <p style={{ fontSize: '0.875rem' }}>다른 지역이나 역 이름으로 검색해보세요</p>
              </div>
            )}
          </div>
        </section>

        <section id="report" className="section" style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: 'var(--radius-2xl)', margin: '2rem 0', textAlign: 'center' }}>
          <h2 className="section-title">📢 짐보관소 제보하기</h2>
          <p className="section-subtitle">
            새로운 짐보관소를 알고 계신가요? 간단히 알려주세요!
          </p>
          <button
            onClick={() => openModal('report')}
            className="btn btn-primary"
            style={{ fontSize: '1.125rem', padding: '1rem 2.5rem' }}
          >
            📝 제보하기
          </button>
        </section>



        {/* FAQ Section */}
        <section id="faq" className="section">
          <h2 className="section-title">❓ 자주 묻는 질문</h2>
          <p className="section-subtitle">
            궁금하신 점을 빠르게 확인하세요
          </p>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {faqItems.map((item, i) => (
              <div key={i} className="faq-item">
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>Q. {item.q}</span>
                  <svg
                    className={`faq-icon ${openFaq === i ? 'faq-icon-open' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">
                    A. {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact-us" className="section" style={{ textAlign: 'center' }}>
          <h2 className="section-title">💬 문의하기</h2>
          <p className="section-subtitle">
            궁금하신 점이나 제안이 있으시면 언제든 연락주세요
          </p>
          <a href="mailto:ysk7998@gmail.com" className="btn btn-primary" style={{ fontSize: '1.125rem' }}>
            📧 ysk7998@gmail.com
          </a>
        </section>
      </main>



      <AiModal goToMapLocation={goToMapLocation} />

      {/* 정보 수정 요청 모달 */}
      {editStorage && (
        <EditRequestModal
          storage={editStorage}
          onClose={() => setEditStorage(null)}
        />
      )}

    </>
  );
}
