const CACHE_NAME = 'pda-digital-garden-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './garden.html',
  './manifest.json',
  'https://d3js.org/d3.v7.min.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap'
];

// 서비스 워커 설치 및 리소스 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA Service Worker] Caching core app shell & assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[PWA Service Worker] Pre-cache fallback warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 서비스 워커 활성화 및 구버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 우선 / 오프라인 캐시 폴백 오프라인 구동 정책
self.addEventListener('fetch', (event) => {
  // GET 요청에만 캐시 응답 수행
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 성공적인 응답은 캐시에 업데이트
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 네트워크가 차단되거나 오프라인일 때 캐시된 자원 반환
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
