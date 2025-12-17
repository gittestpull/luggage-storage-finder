// src/components/places/NewPlaceForm.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

// Define the type for the location state
interface Location {
  lat: number;
  lng: number;
}

export default function NewPlaceForm() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<FileList | null>(null);
    const [location, setLocation] = useState<Location | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Refs for Google Maps
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(e.target.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !address || !location) {
            setMessage({ type: 'error', text: '이름, 주소, 그리고 지도 위치를 모두 지정해야 합니다.' });
            return;
        }
        setIsSubmitting(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('address', address);
        formData.append('description', description);
        formData.append('latitude', location.lat.toString());
        formData.append('longitude', location.lng.toString());

        // Temporarily remove rating as per new simplified UX
        const simplifiedRating = { location: 3, taste: 3, price: 3, service: 3, atmosphere: 3 };
        formData.append('rating', JSON.stringify(simplifiedRating));

        if (photos) {
            for (let i = 0; i < photos.length; i++) {
                formData.append('photos', photos[i]);
            }
        }

        try {
            const res = await fetch('/api/places', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '성공적으로 제보되었습니다. 관리자 승인 후 등록됩니다.' });
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                const errorData = await res.json();
                setMessage({ type: 'error', text: `오류가 발생했습니다: ${errorData.error || '알 수 없는 오류'}` });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Google Maps initialization and search logic
    const initMap = useCallback(() => {
        const mapDiv = document.getElementById('map');
        if (!mapDiv) return;

        const initialLocation = { lat: 37.5665, lng: 126.9780 }; // Seoul City Hall

        const map = new google.maps.Map(mapDiv, {
            center: initialLocation,
            zoom: 12,
            streetViewControl: false,
            mapTypeControl: false,
        });
        mapRef.current = map;

        const marker = new google.maps.Marker({
            map: map,
            draggable: true,
            title: "이곳으로 위치를 지정하려면 핀을 드래그하세요.",
        });
        markerRef.current = marker;

        // Listen for marker dragend event
        google.maps.event.addListener(marker, 'dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                setLocation({ lat, lng });

                // Reverse geocode to get address
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        setAddress(results[0].formatted_address);
                    }
                });
            }
        });

        // Setup Places Autocomplete
        if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
            autocomplete.bindTo('bounds', map);
            autocomplete.setFields(['address_components', 'geometry', 'icon', 'name', 'formatted_address']);

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) {
                    return;
                }

                // If the place has a geometry, then present it on a map.
                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);
                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                }
                marker.setPosition(place.geometry.location);
                marker.setVisible(true);

                setAddress(place.formatted_address || '');
                if(place.name) setName(prev => prev || place.name)

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setLocation({ lat, lng });
            });
        }
    }, []);

    useEffect(() => {
        if (window.google) {
            initMap();
        }
    }, [initMap]);


    return (
        <>
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`}
                strategy="afterInteractive"
                async
                defer
            />
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">새로운 장소 제보하기</h1>
                    <p className="mt-4 text-lg text-gray-600">지도에 없거나 새로운 짐보관소를 알려주세요. 소중한 정보는 다른 여행자에게 큰 도움이 됩니다.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">1. 기본 정보</h2>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">장소 이름</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">간단한 설명</label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="예: 서울역 1번 출구 앞, 24시간 운영, 대형 캐리어 가능"
                                />
                            </div>
                             <div>
                                <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-1">사진 (선택)</label>
                                <input type="file" id="photos" name="photos" onChange={handlePhotoChange} multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"/>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">2. 위치 정보</h2>
                        <div>
                            <label htmlFor="address-search" className="block text-sm font-medium text-gray-700 mb-1">주소 검색</label>
                            <input
                                ref={searchInputRef}
                                type="text"
                                id="address-search"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="정확한 주소 또는 건물 이름을 입력하세요"
                            />
                             <p className="mt-2 text-sm text-gray-500">주소를 검색하거나, 지도에서 핀을 드래그하여 정확한 위치를 지정할 수 있습니다.</p>
                        </div>
                        <div id="map" className="w-full h-80 mt-4 rounded-lg bg-gray-200"></div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="text-center pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-12 py-4 border border-transparent text-lg font-bold rounded-full shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition-transform transform hover:scale-105"
                        >
                            {isSubmitting ? '제출 중...' : '제보하기'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
