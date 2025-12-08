'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import PremiumList from '@/components/admin/PremiumList';

export default function PremiumManagement() {
  const [storages, setStorages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStorages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/storages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStorages(response.data);
    } catch (error) {
      console.error('Failed to fetch storages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorages();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">프리미엄 관리</h1>
      <PremiumList storages={storages} onRefresh={fetchStorages} />
    </div>
  );
}
