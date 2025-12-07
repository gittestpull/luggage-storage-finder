// public/custom-sw.js

console.log('Custom Service Worker loaded - Push Notification Logic');

// 푸시 알림 수신
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    console.log('Push received:', data);

    const title = data.title || '새 알림';
    const options = {
        body: data.body || '새로운 메시지가 도착했습니다.',
        icon: data.icon || '/images/icon-192x192.png',
        badge: data.badge || '/images/badge-72x72.png',
        data: data.data || {},
        vibrate: [200, 100, 200],
        tag: 'luggage-notification',
        renotify: true,
        actions: [
            { action: 'open', title: '열기' },
            { action: 'close', title: '닫기' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification);
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// 백그라운드 동기화 (향후 오프라인 제보 지원용)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reports') {
        event.waitUntil(syncPendingReports());
    }
});

async function syncPendingReports() {
    console.log('Syncing pending reports...');
    // 추후 구현: IndexedDB에서 대기 중인 제보 데이터 가져와서 서버로 전송
}
