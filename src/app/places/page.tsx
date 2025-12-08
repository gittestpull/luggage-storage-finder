"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Place {
    _id: string;
    name: string;
    address: string;
    description: string;
}

export default function PlacesPage() {
    const [places, setPlaces] = useState<Place[]>([]);

    useEffect(() => {
        const fetchPlaces = async () => {
            const res = await fetch('/api/places');
            const data = await res.json();
            if (data.success) {
                setPlaces(data.data);
            }
        };
        fetchPlaces();
    }, []);

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold my-4">가볼만한 곳</h1>
            <Link href="/places/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                새로운 장소 추가
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {places.map(place => (
                    <div key={place._id} className="border p-4 rounded-lg">
                        <h2 className="text-xl font-semibold">
                            <Link href={`/places/${place._id}`}>{place.name}</Link>
                        </h2>
                        <p>{place.address}</p>
                        <p>{place.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
