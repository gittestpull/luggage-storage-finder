'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MapMarker {
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
    onClick?: () => void;
}

interface GoogleMapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: MapMarker[];
    onMapClick?: (lat: number, lng: number) => void;
    className?: string;
    selectedMarkerIndex?: number;
}

declare global {
    interface Window {
        // google: typeof google;
        initGoogleMaps?: () => void;
    }
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // Seoul
const DEFAULT_ZOOM = 12;

const MARKER_ICONS = {
    default: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    article: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
    articleHighlight: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    storage: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    user: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
};

export default function GoogleMap({
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    markers = [],
    onMapClick,
    className = '',
    selectedMarkerIndex = -1,
}: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([]);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Google Maps script
    useEffect(() => {
        if (window.google?.maps) {
            setScriptLoaded(true);
            return;
        }

        const loadScript = async () => {
            try {
                // Fetch the script from our API route
                const response = await fetch('/api/maps/script?callback=initGoogleMaps&libraries=geometry');
                if (!response.ok) {
                    throw new Error('Failed to load Google Maps');
                }
                const scriptContent = await response.text();

                // Create a promise that resolves when the callback is called
                const loadPromise = new Promise<void>((resolve) => {
                    window.initGoogleMaps = () => {
                        setScriptLoaded(true);
                        resolve();
                    };
                });

                // Execute the script
                const script = document.createElement('script');
                script.innerHTML = scriptContent;
                document.head.appendChild(script);

                await loadPromise;
            } catch (err) {
                console.error('Error loading Google Maps:', err);
                setError('지도를 불러오는데 실패했습니다.');
            }
        };

        loadScript();
    }, []);

    // Initialize map
    useEffect(() => {
        if (!scriptLoaded || !mapRef.current || map) return;

        const newMap = new window.google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });

        if (onMapClick) {
            newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    onMapClick(e.latLng.lat(), e.latLng.lng());
                }
            });
        }

        setMap(newMap);
    }, [scriptLoaded, center, zoom, onMapClick, map]);

    // Update markers
    useEffect(() => {
        if (!map) return;

        // Clear existing markers
        mapMarkers.forEach(marker => marker.setMap(null));

        // Create new markers
        const newMarkers = markers.map((markerData, index) => {
            const marker = new window.google.maps.Marker({
                position: markerData.position,
                map,
                title: markerData.title,
                icon: index === selectedMarkerIndex
                    ? MARKER_ICONS.articleHighlight
                    : (markerData.icon || MARKER_ICONS.default),
            });

            if (markerData.onClick) {
                marker.addListener('click', markerData.onClick);
            }

            return marker;
        });

        setMapMarkers(newMarkers);

        // Fit bounds if there are markers
        if (markers.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            markers.forEach(m => bounds.extend(m.position));
            if (markers.length === 1) {
                map.setCenter(markers[0].position);
                map.setZoom(14);
            } else {
                map.fitBounds(bounds);
            }
        }
    }, [map, markers, selectedMarkerIndex]);

    // Pan to center when it changes
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
        }
    }, [map, center]);

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className={`rounded-xl ${className}`}
            style={{ minHeight: '300px' }}
        >
            {!scriptLoaded && (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">지도 로딩 중...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export { MARKER_ICONS };
