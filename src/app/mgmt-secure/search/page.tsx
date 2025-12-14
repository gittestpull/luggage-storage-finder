'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import UserList from '@/components/admin/UserList';
import StorageList from '@/components/admin/StorageList';
import ReportList from '@/components/admin/ReportList';
import PendingPlacesList from '@/components/admin/PendingPlacesList';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState<any>({
        users: [],
        storages: [],
        reports: [],
        places: []
    });
    const [loading, setLoading] = useState(true);

    const fetchResults = useCallback(async () => {
        if (!query) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`/api/admin/search?q=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(response.data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    if (!query) {
        return <div className="text-center text-gray-500 mt-10">검색어를 입력해주세요.</div>;
    }

    if (loading) {
        return <div className="text-center text-gray-500 mt-10">검색 중...</div>;
    }

    const hasResults = results.users.length > 0 || results.storages.length > 0 || results.reports.length > 0 || results.places.length > 0;

    if (!hasResults) {
        return <div className="text-center text-gray-500 mt-10">"{query}"에 대한 검색 결과가 없습니다.</div>;
    }

    return (
        <div className="space-y-12">
            <h1 className="text-2xl font-bold">"{query}" 검색 결과</h1>

            {results.users.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">사용자 ({results.users.length})</h2>
                    <UserList users={results.users} onRefresh={fetchResults} />
                </section>
            )}

            {results.storages.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">짐보관소 ({results.storages.length})</h2>
                    <StorageList storages={results.storages} onRefresh={fetchResults} />
                </section>
            )}

            {results.reports.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">제보 ({results.reports.length})</h2>
                    <ReportList reports={results.reports} onRefresh={fetchResults} />
                </section>
            )}

            {results.places.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">맛집/카페 ({results.places.length})</h2>
                    <PendingPlacesList places={results.places} onRefresh={fetchResults} />
                </section>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading search...</div>}>
            <SearchContent />
        </Suspense>
    );
}
