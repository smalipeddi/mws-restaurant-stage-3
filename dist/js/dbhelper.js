'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* eslint event: "off"*/
/**
 * Common database helper functions.
 */

//import idb from 'idb';
var dbPromise = idb.open('db', 2, function (upgradeDb) {
  switch (upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurantsList', {
        keyPath: 'id'
      });
    case 1:
      var reviewsStore = upgradeDb.createObjectStore('reviewsList', {
        keyPath: 'id'
      });
      reviewsStore.createIndex('restaurant', 'restaurant_id');
  }
});

var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: 'fetchRestaurants',


    /**
    * Fetch all restaurants
    */
    value: function fetchRestaurants() {
      return dbPromise.then(function (db) {
        var tx = db.transaction('restaurantsList');
        var restaurantStore = tx.objectStore('restaurantsList');
        return restaurantStore.getAll();
      }).then(function (restaurants) {
        if (restaurants.length !== 0) {
          return restaurants;
        }
        return fetch(DBHelper.DATABASE_URL + 'restaurants').then(function (response) {
          return response.json();
        }).then(function (restaurants) {
          return dbPromise.then(function (db) {
            var tx = db.transaction('restaurantsList', 'readwrite');
            var restaurantStore = tx.objectStore('restaurantsList');
            restaurants.forEach(function (restaurant) {
              return restaurantStore.put(restaurant);
            });
            tx.complete;
            return restaurants;
          });
        });
      });
    }

    /**
    * Fetch all reviews by restaurant id
    */

  }, {
    key: 'fetchReviewsByRestaurantId',
    value: function fetchReviewsByRestaurantId(id) {

      return fetch(DBHelper.DATABASE_URL + "reviews/?restaurant_id=" + id, { method: "GET" }).then(function (resp) {
        return resp.json();
      }).then(function (reviews) {
        dbPromise.then(function (db) {
          if (!db) return;
          var tx = db.transaction('reviewsList', 'readwrite');
          var reviewsStore = tx.objectStore('reviewsList');
          if (Array.isArray(reviews)) {
            //store array of reviews from server
            reviews.forEach(function (review) {
              reviewsStore.put(review);
            });
          } else {
            reviewsStore.put(reviews);
          }
        });
        console.log("reviews from servre", reviews);
        return reviews;
      }).catch(function (error) {
        return DBHelper.cacheReviewsFromDb(id);
      });
    }

    /**
    * Send reviews to the Server and save to Database.
    */

  }, {
    key: 'sendReviewsToServer',
    value: function sendReviewsToServer(jsonData) {

      var fetch_options = {
        method: 'POST',
        body: JSON.stringify(jsonData),
        headers: new Headers({ 'Content-Type': 'application/json' })
      };

      fetch("http://localhost:1337/reviews", fetch_options).then(function (response) {
        return response.json();
      }).then(function (data) {
        console.log("Saved reviews successfully");
        DBHelper.saveReviewsToDatabase(data);
      }).catch(function (error) {
        return console.log('error:', error);
      });
    }
  }, {
    key: 'sendReviewsWhenOnline',
    value: function sendReviewsWhenOnline(data) {

      DBHelper.saveReviewsTolocalStorage(data);
      console.log("saving data to local storage", data);
      window.addEventListener('online', function (event) {
        console.log("online again");
        var offLineData = DBHelper.getReviewsFromlocalStorage();
        console.log(offLineData);
        if (offLineData !== null) {
          offLineData.forEach(function (reviewObj) {
            DBHelper.sendReviewsToServer(reviewObj.data);
          });
        }
        console.log('LocalStorage data sent to server');
        localStorage.removeItem('reviews');
        console.log("localStorage + ${offLineData.object_type}   removed");
      });
    }
  }, {
    key: 'saveReviewsToDatabase',
    value: function saveReviewsToDatabase(reviews) {
      /* Store data in database */
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction("reviewsList", "readwrite");
        var store = tx.objectStore("reviewsList");

        /* check if we are storing an object or an Array of objects */
        if (reviews !== undefined && Array.isArray(reviews)) {
          reviews.forEach(function (res) {
            store.put(res);
          });
        } else {
          store.put(reviews);
        }

        return tx.complete;
      });
    }
  }, {
    key: 'saveReviewsTolocalStorage',
    value: function saveReviewsTolocalStorage(offlineReviewsList) {
      var existing = localStorage.getItem('reviews');
      existing = existing ? JSON.parse(existing) : [];
      existing.push(offlineReviewsList);
      window.localStorage.setItem("reviews", JSON.stringify(existing));
    }
  }, {
    key: 'getReviewsFromlocalStorage',
    value: function getReviewsFromlocalStorage() {
      return JSON.parse(window.localStorage.getItem("reviews"));
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id) {
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        return restaurants.find(function (r) {
          return r.id === id;
        });
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisine',
    value: function fetchRestaurantByCuisine(cuisine) {
      // Fetch all restaurants  with proper error handling
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        return restaurants.filter(function (r) {
          return r.cuisine_type == cuisine;
        });
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByNeighborhood',
    value: function fetchRestaurantByNeighborhood(neighborhood) {
      // Fetch all restaurants
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        return restaurants.filter(function (r) {
          return r.neighborhood == neighborhood;
        });
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisineAndNeighborhood',
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        var results = restaurants;
        if (cuisine !== 'all') {
          // filter by cuisine
          results = results.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
        }
        if (neighborhood !== 'all') {
          // filter by neighborhood
          results = results.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
        }
        return results;
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: 'fetchNeighborhoods',
    value: function fetchNeighborhoods() {
      // Fetch all restaurants
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        // Get all neighborhoods from all restaurants
        var neighborhoods = restaurants.map(function (v, i) {
          return restaurants[i].neighborhood;
        });
        // Remove duplicates from neighborhoods
        var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
          return neighborhoods.indexOf(v) == i;
        });
        return uniqueNeighborhoods;
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: 'fetchCuisines',
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        // Get all cuisines from all restaurants
        var cuisines = restaurants.map(function (v, i) {
          return restaurants[i].cuisine_type;
        });
        // Remove duplicates from cuisines
        var uniqueCuisines = cuisines.filter(function (v, i) {
          return cuisines.indexOf(v) == i;
        });
        return uniqueCuisines;
      });
    }
  }, {
    key: 'updateFavouriteStatus',
    value: function updateFavouriteStatus(restaurantId, isFavourite) {
      console.log('changing favorite status to: ', isFavourite);

      fetch('http://localhost:1337/restaurants/' + restaurantId + '/?is_favorite=' + isFavourite, {
        method: 'PUT'
      }).then(function () {
        dbPromise.then(function (db) {
          var tx = db.transaction('restaurantsList', 'readwrite');
          var restaurantsStore = tx.objectStore('restaurantsList');
          restaurantsStore.get(restaurantId).then(function (restaurant) {
            restaurant.is_favorite = isFavourite;
            restaurantsStore.put(restaurant);
          });
        });
      });
    }

    /**
    * Cache Reviews from Database
    */

  }, {
    key: 'cacheReviewsFromDb',
    value: function cacheReviewsFromDb(id) {

      var reviews = dbPromise.then(function (db) {
        var tx = db.transaction("reviewsList", "readonly");
        var store = tx.objectStore("reviewsList");

        return store.getAll(id);
      });

      return reviews;
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return './restaurant.html?id=' + restaurant.id;
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant) {
      return '/img/' + restaurant.photograph + '.webp';
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: 'mapMarkerForRestaurant',
    value: function mapMarkerForRestaurant(restaurant) {
      // https://leafletjs.com/reference-1.3.0.html#marker  
      var marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], { title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
      marker.addTo(newMap);
      return marker;
    }
  }, {
    key: 'DATABASE_URL',


    /**
    * Database URL.
    */
    get: function get() {
      var port = 1337; // Changed this to your server port
      return 'http://localhost:' + port + '/';
    }
  }]);

  return DBHelper;
}();