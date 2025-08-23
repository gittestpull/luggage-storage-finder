/**
 * api.js
 * API 통신 관련 함수들을 정의합니다.
 */

// 모든 짐보관소 데이터 가져오기
async function fetchAllStorages() {
    try {
        const headers = {};
        const userToken = localStorage.getItem('userToken');
        if (userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
        }

        const response = await fetch('/api/storages', {
            headers: headers
        });

        if (!response.ok) {
            console.error('API 응답 오류:', response.status, response.statusText);
            const errorData = await response.json();
            console.error('API 오류 데이터:', errorData);
            throw new Error(`서버에서 데이터를 불러오지 못했습니다: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('fetchAllStorages 응답 데이터:', data);
        return data;
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
        // FormData를 일반 객체로 변환
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // lat, lng 값을 location 객체로 변환
        const lat = formData.get('lat');
        const lng = formData.get('lng');
        if (lat && lng) {
            data.location = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };
            // 원본 formData에서 lat, lng 제거 (중복 방지)
            delete data.lat;
            delete data.lng;
        }

        // 로그인한 사용자의 ID를 reportedBy 필드에 추가
        const userId = localStorage.getItem('userId');
        if (userId) {
            data.reportedBy = userId;
        } else {
            // 로그인하지 않은 경우 제보 불가 또는 익명 처리
            alert('제보를 위해 로그인해주세요.');
            throw new Error('로그인이 필요합니다.');
        }

        const response = await fetch('/api/storages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
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