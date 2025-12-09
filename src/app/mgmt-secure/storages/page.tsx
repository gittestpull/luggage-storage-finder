'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import StorageList from '@/components/admin/StorageList';
import PendingPlacesList from '@/components/admin/PendingPlacesList';

export default function StorageManagement() {
    const [storages, setStorages] = useState([]);
    const [pendingPlaces, setPendingPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch approved storages
            const storageResponse = await axios.get('/api/admin/storages', { headers });
            setStorages(storageResponse.data);

            // Fetch pending places
            const pendingResponse = await axios.get('/api/admin/places/pending', { headers });
            setPendingPlaces(pendingResponse.data.data);

        } catch (error) {
            console.error('Failed to fetch data', error);
            // Optionally show an error message to the user
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold mb-2">승인 대기중인 제보</h1>
                <p className="text-gray-600 mb-6">사용자들이 제보한 새로운 장소입니다. 검토 후 승인 또는 거절해주세요.</p>
                <PendingPlacesList places={pendingPlaces} onRefresh={fetchAllData} />
            </div>
            
            <div className="border-t pt-12">
                <h1 className="text-3xl font-bold mb-8">등록된 짐보관소 관리</h1>
                <StorageList storages={storages} onRefresh={fetchAllData} />
            </div>
        </div>
    );
}