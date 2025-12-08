"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPlacePage() {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState({
        location: 3,
        taste: 3,
        price: 3,
        service: 3,
        atmosphere: 3,
    });
    const [photos, setPhotos] = useState<FileList | null>(null);
    const router = useRouter();

    const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRating(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(e.target.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('address', address);
        formData.append('description', description);
        formData.append('rating', JSON.stringify(rating));
        if (photos) {
            for (let i = 0; i < photos.length; i++) {
                formData.append('photos', photos[i]);
            }
        }

        const res = await fetch('/api/places', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            router.push('/places');
        }
    };

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold my-4">새로운 장소 추가</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">주소</label>
                    <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">평점</h3>
                    <div className="space-y-2">
                        {Object.keys(rating).map((key) => (
                            <div key={key}>
                                <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">{key} ({rating[key as keyof typeof rating]})</label>
                                <input type="range" id={key} name={key} min="1" max="5" value={rating[key as keyof typeof rating]} onChange={handleRatingChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="photos" className="block text-sm font-medium text-gray-700">사진</label>
                    <input type="file" id="photos" name="photos" onChange={handlePhotoChange} multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold" />
                </div>

                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    추가하기
                </button>
            </form>
        </div>
    );
}
