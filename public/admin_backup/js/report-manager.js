document.addEventListener('DOMContentLoaded', () => {
    // admin-main.js의 동적 로딩을 고려하여 위임 방식으로 이벤트 처리
    document.body.addEventListener('click', async (e) => {
        if (e.target.matches('.approve-btn, .reject-btn')) {
            const id = e.target.dataset.id;
            const status = e.target.dataset.status;
            if (confirm(`이 제보를 정말로 '${status === 'approved' ? '승인' : '반려'}'하시겠습니까?`)) {
                try {
                    await updateReportStatusAdmin(id, status);
                    loadReports(); // 목록 새로고침
                } catch (error) {
                    alert(`처리 실패: ${error.message}`);
                }
            }
        }
    });

    // 페이지 로드 시 초기화 함수 호출
// if (document.getElementById('report-list-body')) {
//     loadReports();
// }
});

// 제보 목록 로드 및 표시
async function loadReports() {
    const reportListBody = document.getElementById('report-list-body');
    if (!reportListBody) return;

    try {
        const reports = await fetchAllReportsAdmin(); // admin-api.js
        reportListBody.innerHTML = '';
        if (reports.length === 0) {
            reportListBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">새로운 제보가 없습니다.</td></tr>`;
            return;
        }
        reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${report.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${report.address}</td>
                <td class="px-6 py-4 whitespace-nowrap">${report.reportedBy ? report.reportedBy.username : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(report.createdAt).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(report.reportStatus)}">
                        ${report.reportStatus}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${report.reportStatus === 'pending' ? 
                    `<button class="text-green-600 hover:text-green-900 approve-btn" data-id="${report._id}" data-status="approved">승인</button>
                     <button class="text-red-600 hover:text-red-900 ml-4 reject-btn" data-id="${report._id}" data-status="rejected">반려</button>` : '처리 완료'
                    }
                </td>
            `;
            reportListBody.appendChild(row);
        });
    } catch (error) {
        reportListBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">데이터 로드 실패: ${error.message}</td></tr>`;
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
