importScripts('/js/idb.js');
var CACHE_NAME = 'mws-restaurant-stage-1-cache';

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
  './app.js'

  
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request).then(function(resp) {
//       return resp || fetch(event.request);
//     })
//   );
// });

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});

// self.addEventListener('fetch', function(event) {
//    if (event.request.url.startsWith(self.location.origin)) {
//        event.respondWith(
//            caches.match(event.request).then(function(response) {
//               return response || fetch(event.request).then(function(fetch_resp){
//                 let responseClone = fetch_resp.clone(); //clone network data for offline use 
//                 caches.open(CACHE_NAME).then(function(cache) {
//                   cache.put(event.request, responseClone);
//                 });
//                 return fetch_resp;
//               });
//            }).catch(error => {
//                  console.log("Unable to retrive from cache , $error");

//            }));
       
//    }
// });

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request).then(function(resp) {
//       return resp || fetch(event.request).then(function(response) {
//         let responseClone = response.clone(); //clone network data for offline use 
//         caches.open(CACHE_NAME).then(function(cache) {
//           cache.put(event.request, responseClone);
//         });

//         return response;
//       });
//     }).catch(error => {
//          console.log("Unable to retrive from cache , $error");

//     }));
// });
