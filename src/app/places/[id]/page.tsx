"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Review {
    user: { username: string };
    text: string;
    photo?: string;
}

interface Tip {
    user: { username: string };
    text: string;
}

interface Place {
    name: string;
    address: string;
    description: string;
    photos: string[];
    reviews: Review[];
    tips: Tip[];
    rating: {
        location: number;
        taste: number;
        price: number;
        service: number;
        atmosphere: number;
    };
}

export default function PlaceDetailPage() {
    const { id } = useParams();
    const [place, setPlace] = useState<Place | null>(null);
    const [reviewText, setReviewText] = useState('');
    const [reviewPhoto, setReviewPhoto] = useState<File | null>(null);
    const [tipText, setTipText] = useState('');

    useEffect(() => {
        if (id) {
            const fetchPlace = async () => {
                const res = await fetch(`/api/places/${id}`);
                const data = await res.json();
                if (data.success) {
                    setPlace(data.data);
                }
            };
            fetchPlace();
        }
    }, [id]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('text', reviewText);
        if (reviewPhoto) {
            formData.append('photo', reviewPhoto);
        }

        const res = await fetch(`/api/places/${id}/reviews`, {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            const updatedPlace = await res.json();
            setPlace(updatedPlace.data);
            setReviewText('');
            setReviewPhoto(null);
        }
    };

    const handleTipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`/api/places/${id}/tips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: tipText }),
        });
        if (res.ok) {
            const updatedPlace = await res.json();
            setPlace(updatedPlace.data);
            setTipText('');
        }
    };

    if (!place) {
        return <div>Loading...</div>;
    }

    const chartData = {
        labels: ['위치', '맛', '가격', '서비스', '분위기'],
        datasets: [
            {
                label: '종합 평가',
                data: [
                    place.rating.location,
                    place.rating.taste,
                    place.rating.price,
                    place.rating.service,
                    place.rating.atmosphere,
                ],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-4">{place.name}</h1>
            <p className="text-lg">{place.address}</p>
            <p className="mt-2">{place.description}</p>

            <div className="w-full md:w-1/2 lg:w-1/3 mx-auto my-4">
                <Radar data={chartData} />
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold">리뷰</h2>
                {place.reviews.map((review, index) => (
                    <div key={index} className="border-b py-2">
                        <p><strong>{review.user.username}</strong></p>
                        <p>{review.text}</p>
                        {review.photo && <Image src={review.photo} alt="Review photo" width={200} height={200} className="mt-2 rounded-lg" />}
                    </div>
                ))}
                <form onSubmit={handleReviewSubmit} className="mt-4">
                    <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} className="w-full border p-2" placeholder="리뷰를 남겨주세요." required />
                    <input type="file" onChange={e => setReviewPhoto(e.target.files ? e.target.files[0] : null)} className="mt-2" />
                    <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded mt-2">리뷰 작성</button>
                </form>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold">꿀팁</h2>
                {place.tips.map((tip, index) => (
                    <div key={index} className="border-b py-2">
                        <p><strong>{tip.user.username}</strong></p>
                        <p>{tip.text}</p>
                    </div>
                ))}
                <form onSubmit={handleTipSubmit} className="mt-4">
                    <textarea value={tipText} onChange={e => setTipText(e.target.value)} className="w-full border p-2" placeholder="꿀팁을 공유해주세요." required />
                    <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded mt-2">꿀팁 추가</button>
                </form>
            </div>
        </div>
    );
}
