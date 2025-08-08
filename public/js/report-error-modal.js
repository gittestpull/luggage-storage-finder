document.addEventListener('DOMContentLoaded', () => {
    const reportErrorModal = document.getElementById('reportErrorModal');
    const closeReportErrorModalBtn = document.getElementById('closeReportErrorModal');
    const submitReportErrorBtn = document.getElementById('submitReportError');
    const modalStorageName = document.getElementById('modalStorageName');
    const reportErrorDescription = document.getElementById('reportErrorDescription');

    let currentStorageId = null;
    let currentStorageName = '';

    // Function to open the modal
    window.openReportErrorModal = (storageId, storageName) => {
        currentStorageId = storageId;
        currentStorageName = storageName || '알 수 없는 짐보관소'; // storageName이 없을 경우 기본값 설정
        modalStorageName.textContent = `짐보관소: ${currentStorageName}`;
        reportErrorDescription.value = ''; // Clear previous input
        reportErrorModal.classList.remove('hidden');
    };

    // Function to close the modal
    closeReportErrorModalBtn.addEventListener('click', () => {
        reportErrorModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    reportErrorModal.addEventListener('click', (event) => {
        if (event.target === reportErrorModal) {
            reportErrorModal.classList.add('hidden');
        }
    });

    // Handle report submission
    submitReportErrorBtn.addEventListener('click', async () => {
        const description = reportErrorDescription.value.trim();

        if (!description) {
            alert('신고 내용을 입력해주세요.');
            return;
        }

        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    storageId: currentStorageId,
                    storageName: currentStorageName,
                    description: description
                })
            });

            if (response.ok) {
                alert('신고가 성공적으로 접수되었습니다. 감사합니다!');
                reportErrorModal.classList.add('hidden');
            } else {
                const errorData = await response.json();
                alert(`신고 접수 실패: ${errorData.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('신고 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    });
});
