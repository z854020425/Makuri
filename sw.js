const CACHE_NAME = 'video-cache-v1';
const VIDEO_URLS = ['./assets/videos/snow.mp4'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
		.then(cache => cache.addAll(VIDEO_URLS))	
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request)
		.then(response => response || fetch(event.request))
	);
})