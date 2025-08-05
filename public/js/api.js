/**
 * api.js
 * API 통신 관련 함수들을 정의합니다.
 */

// 모든 짐보관소 데이터 가져오기
async function fetchAllStorages() {
    try {
        const response = await fetch('/api/storages');
        if (!response.ok) {
            throw new Error('서버에서 데이터를 불러오지 못했습니다.');
        }
        return await response.json();
    } catch (error) {
        console.error('짐보관소 데이터 불러오기 실패:', error);
        return [];
    }
}

// 검색어로 짐보관소 검색
async function searchStorages(keyword) {
    try {
        const response = await fetch(`/api/storages/search?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            throw new Error('검색 결과를 불러오지 못했습니다.');
        }
        return await response.json();
    } catch (error) {
        console.error('짐보관소 검색 실패:', error);
        return [];
    }
}

// 위치 기반 짐보관소 검색
async function findNearbyStorages(lat, lng, maxDistance = 5000) {
    try {
        const response = await fetch(`/api/storages/near?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`);
        if (!response.ok) {
            throw new Error('주변 짐보관소를 불러오지 못했습니다.');
        }
        return await response.json();
    } catch (error) {
        console.error('주변 짐보관소 검색 실패:', error);
        return [];
    }
}

// 새 짐보관소 제보하기
async function submitStorageReport(formData) {
    try {
        const response = await fetch('/api/storages', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '제보 중 오류가 발생했습니다.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('짐보관소 제보 실패:', error);
        throw error;
    }
}

// 짐보관소 상태 업데이트
async function updateStorageStatus(id, isOpen) {
    try {
        const response = await fetch(`/api/storages/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isOpen })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '상태 업데이트 중 오류가 발생했습니다.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('짐보관소 상태 업데이트 실패:', error);
        throw error;
    }
}