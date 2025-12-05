'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import ReportList from '@/components/admin/ReportList';

export default function ReportManagement() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/admin/reports', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReports(response.data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">제보 관리</h1>
            <ReportList reports={reports} onRefresh={fetchReports} />
        </div>
    );
}
