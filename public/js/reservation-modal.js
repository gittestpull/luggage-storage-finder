document.addEventListener('DOMContentLoaded', () => {
    const reservationModal = document.getElementById('reservationModal');
    const closeReservationModalBtn = document.getElementById('closeReservationModal');
    const reservationForm = document.getElementById('reservationForm');
    const modalReservationStorageName = document.getElementById('modalReservationStorageName');

    let currentStorageIdForReservation = null;
    let currentStorageNameForReservation = '';

    // Function to open the modal
    window.openReservationModal = (storageId, storageName) => {
        currentStorageIdForReservation = storageId;
        currentStorageNameForReservation = storageName;
        modalReservationStorageName.textContent = `짐보관소: ${storageName}`;
        reservationForm.reset(); // Clear previous input
        reservationModal.classList.remove('hidden');
    };

    // Function to close the modal
    closeReservationModalBtn.addEventListener('click', () => {
        reservationModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    reservationModal.addEventListener('click', (event) => {
        if (event.target === reservationModal) {
            reservationModal.classList.add('hidden');
        }
    });

    // Handle reservation submission
    reservationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const reserverName = document.getElementById('reserverName').value.trim();
        const reserverEmail = document.getElementById('reserverEmail').value.trim();
        const reserverPhone = document.getElementById('reserverPhone').value.trim();

        if (!reserverName || !reserverEmail) {
            alert('이름과 이메일은 필수 입력 사항입니다.');
            return;
        }

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}` // 로그인된 사용자만 예약 가능
                },
                body: JSON.stringify({
                    storageId: currentStorageIdForReservation,
                    storageName: currentStorageNameForReservation,
                    reserverName,
                    reserverEmail,
                    reserverPhone
                })
            });

            if (response.ok) {
                alert('예약 요청이 성공적으로 접수되었습니다. 감사합니다!');
                reservationModal.classList.add('hidden');
            } else {
                const errorData = await response.json();
                alert(`예약 요청 실패: ${errorData.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('Error submitting reservation:', error);
            alert('예약 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    });
});