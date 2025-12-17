// src/components/modals/AddPlaceModal.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';

interface Location {
  lat: number;
  lng: number;
}

export default function AddPlaceModal() {
    const { modals, closeModal } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<FileList | null>(null);
    const [location, setLocation] = useState<Location | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        // Reset state
        setName('');
        setAddress('');
        setDescription('');
        setPhotos(null);
        setLocation(null);
        setMessage(null);
        setIsSubmitting(false);
        closeModal('add-place');
    };

    if (!modals['add-place']) return null;

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

        // The new schema in Place.ts does not have lat/lng, but the old Storage.ts does.
        // I will assume the `places` collection is using the `Place` schema, which does not have location coordinates.
        // The user's request was to add a map, which implies coordinates are needed.
        // Let's add coordinates to the Place schema.

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
                    handleClose();
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

    const initMap = useCallback(() => {
        const mapDiv = document.getElementById('add-place-map');
        if (!mapDiv) return;

        const initialLocation = { lat: 37.5665, lng: 126.9780 };

        const map = new google.maps.Map(mapDiv, {
            center: initialLocation,
            zoom: 12,
            streetViewControl: false,
            mapTypeControl: false,
        });
        mapRef.current = map;

        const marker = new google.maps.Marker({ map: map, draggable: true });
        markerRef.current = marker;

        google.maps.event.addListener(marker, 'dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                setLocation({ lat, lng });

                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        setAddress(results[0].formatted_address);
                    }
                });
            }
        });

        if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
            autocomplete.bindTo('bounds', map);
            autocomplete.setFields(['geometry', 'name', 'formatted_address']);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
                else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                }
                marker.setPosition(place.geometry.location);
                marker.setVisible(true);

                setAddress(place.formatted_address || '');
                if(place.name) setName(prev => prev || place.name);

                const { lat, lng } = place.geometry.location;
                setLocation({ lat: lat(), lng: lng() });
            });
        }
    }, []);

    useEffect(() => {
        // We need a unique callback function name for each map instance
        if (!window.initAddPlaceMap) {
            window.initAddPlaceMap = initMap;
        }
        if (modals['add-place'] && window.google) {
            setTimeout(initMap, 0); // Use setTimeout to ensure the DOM is ready
        }
    }, [modals, initMap]);

    return (
        <>
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAddPlaceMap`}
                strategy="lazyOnload"
            />
            <div className="modal-overlay" onClick={handleClose}>
                <div className="glass-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="glass-modal-header">
                        <div className="glass-modal-title">📍 새로운 장소 제보</div>
                        <button className="glass-modal-close" onClick={handleClose}>&times;</button>
                    </div>
                    <div className="glass-modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                         <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">장소 이름</label>
                                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
                            </div>
                            <div>
                                <label htmlFor="address-search" className="block text-sm font-medium text-gray-700 mb-1">주소 검색</label>
                                <input ref={searchInputRef} type="text" id="address-search" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" />
                                <p className="mt-1 text-xs text-gray-500">주소를 검색하거나, 지도에서 핀을 드래그하여 위치를 지정하세요.</p>
                            </div>
                            <div id="add-place-map" className="w-full h-64 mt-2 rounded-lg bg-gray-200"></div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">간단한 설명</label>
                                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="form-input" placeholder="예: 24시간 운영, 가격 정보 등"/>
                            </div>
                             <div>
                                <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-1">사진 (선택)</label>
                                <input type="file" id="photos" name="photos" onChange={handlePhotoChange} multiple className="form-input"/>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                                {isSubmitting ? '제출 중...' : '제보하기'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
declare global {
  interface Window {
    initAddPlaceMap?: () => void;
  }
}

