const CACHE_NAME = 'luggage-finder-v1';
const STATIC_CACHE_NAME = 'luggage-finder-static-v1';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/news.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/map.js',
  '/js/storage-list.js',
  '/js/report-form.js',
  '/js/photo-scan.js',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.log('Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  event.waitUntil(clients.claim());
});

// Fetch 이벤트 - 캐시 우선, 네트워크 폴백
self.addEventListener('fetch', (event) => {
  // API 요청은 항상 네트워크 사용
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // 백그라운드에서 캐시 업데이트
          fetch(event.request).then(response => {
            if (response && response.status === 200) {
              caches.open(STATIC_CACHE_NAME).then(cache => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => { });
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          // 유효한 응답만 캐시
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
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
  // TODO: IndexedDB에서 대기 중인 제보 데이터 가져와서 서버로 전송
  console.log('Syncing pending reports...');
}
