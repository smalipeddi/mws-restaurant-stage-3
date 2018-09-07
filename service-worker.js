importScripts('/js/idb.js');
var CACHE_NAME = 'mws-restaurant-stage-1-cache::';

var urlsToCache = [
  '/',
  './index.html',
  './restaurant.html',
  './css/styles.css',
  './js/dbhelper.js',
  './js/main.js',
  './js/idb.js',
  './js/restaurant_info.js',
  './img/1.jpg',
  './img/2.jpg',
  './img/3.jpg',
  './img/4.jpg',
  './img/5.jpg',
  './img/6.jpg',
  './img/7.jpg',
  './img/8.jpg',
  './img/9.jpg',
  './img/10.jpg',
  './icons/like.svg',
  './icons/unlike.svg',
  './app.js'

  
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME + 'runtime')
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(' SW install complete');
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});


self.addEventListener("fetch", function(event) {
  console.log('SW : fetch event in progress.');

  if (event.request.method !== 'GET' && !event.request.url.includes("browser-sync")) {
    console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
    .then((cached)  => {
          return cached || fetch(event.request)
                           .then(response => {
                                 var cacheCopy = response.clone();
                                 caches.open(CACHE_NAME + 'pages')
                                 .then(function add(cache) {
                                       cache.put(event.request, cacheCopy);
                                      })
                                 .then(() => {
                                    console.log('WORKER: fetch response stored in cache.', event.request.url);
                                  });
                            return response;
                      })
      })
  );
});


