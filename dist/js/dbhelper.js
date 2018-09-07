"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* eslint event: "off"*/
/**
 * Common database helper functions.
 */

//import idb from 'idb';

var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: "openDatabase",


    /**
    * Open Databases.
    */
    value: function openDatabase() {
      var reviewsList;
      var dbPromise = idb.open("restaurants", 2, function (upgradeDb) {
        switch (upgradeDb.oldVersion) {
          case 0:
            if (!upgradeDb.objectStoreNames.contains("restaurantsList")) {
              upgradeDb.createObjectStore("restaurantsList", { keyPath: "id" });
            }
          case 1:
            if (!upgradeDb.objectStoreNames.contains("reviewsList")) {
              var reviewsStore = upgradeDb.createObjectStore("reviewsList", { keyPath: "id" });
              reviewsStore.createIndex('restaurant_id', 'restaurant_id');
            }

        }
      });
      return dbPromise;
    }
    /**
    * Fetch all restaurants
    */

  }, {
    key: "fetchRestaurants",
    value: function fetchRestaurants(callback) {
      if (navigator.onLine) {
        //Fetch from Server and save to database
        var url = DBHelper.DATABASE_URL + 'restaurants';
        fetch(url, { method: "GET" }).then(function (resp) {
          return resp.json();
        }).then(function (restaurants) {
          var dbPromise = DBHelper.openDatabase();

          /* Store data in database */
          dbPromise.then(function (db) {
            if (!db) return;
            var tx = db.transaction("restaurantsList", "readwrite");
            var store = tx.objectStore("restaurantsList");

            /* iterate through data and store in db */
            restaurants.forEach(function (res) {
              store.put(res);
            });
            return tx.complete;
          });

          callback(null, restaurants);
        }).catch(function (error) {
          callback(error, null);
        });
      } else {
        return DBHelper.cacheRestaurantsFromDb().then(function (restaurants) {
          if (restaurants.length) {
            callback(null, restaurants);
          }
        });
      }
    }

    /**
    * Cache Restaurants from Database
    */

  }, {
    key: "cacheRestaurantsFromDb",
    value: function cacheRestaurantsFromDb() {
      var dbPromise = DBHelper.openDatabase();

      var restaurants = dbPromise.then(function (db) {
        var tx = db.transaction("restaurantsList", "readonly");
        var store = tx.objectStore("restaurantsList");
        return store.getAll();
      });

      return restaurants;
    }

    /**
    * Cache Reviews from Database
    */

  }, {
    key: "cacheReviewsFromDb",
    value: function cacheReviewsFromDb(id) {
      var dbPromise = DBHelper.openDatabase();

      var reviews = dbPromise.then(function (db) {
        var tx = db.transaction("reviewsList", "readonly");
        var store = tx.objectStore("reviewsList");
        return store.getAll(id);
      });

      return reviews;
    }

    /**
    * Fetch all reviews by restaurant id
    */

  }, {
    key: "fetchReviewsByRestaurantId",
    value: function fetchReviewsByRestaurantId(id, callback) {
      //Initially Fetch from DataBase if data is present 
      if (navigator.onLine) {

        //Fetch from Server and save to database
        var url = DBHelper.DATABASE_URL + "reviews/?restaurant_id=" + id;

        fetch(url, { method: "GET" }).then(function (resp) {
          return resp.json();
        }).then(function (reviews) {
          callback(null, reviews);
        }).catch(function (error) {
          callback(error, null);
        });
      } else {
        return DBHelper.cacheReviewsFromDb().then(function (reviews) {
          if (reviews.length) {
            callback(null, reviews);
          }
        });
      }
    }

    /**
     * Save Restaurants to Database
     */

  }, {
    key: "saveRestaurantsFavoriteToDatabase",
    value: function saveRestaurantsFavoriteToDatabase(restaurants) {
      var dbPromise = DBHelper.openDatabase();

      /* Store data in database */
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction("restaurantsList", "readwrite");
        var store = tx.objectStore("restaurantsList");

        /* iterate through data and store in db */
        restaurants.forEach(function (res) {
          store.getAll(restaurants.id).put(res);
        });
        return tx.complete;
      });
    }

    /**
    * Save Restaurants to Database
    */

  }, {
    key: "saveReviewsToDatabase",
    value: function saveReviewsToDatabase(reviews) {
      var dbPromise = DBHelper.openDatabase();

      /* Store data in database */
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction("reviewsList", "readwrite");
        var store = tx.objectStore("reviewsList");

        /* check if we are storing an object or an Array of objects */
        if (reviews && (typeof reviews === "undefined" ? "undefined" : _typeof(reviews)) === 'object' && reviews.constructor === Array) {
          reviews.forEach(function (res) {
            store.put(res);
          });
        } else {
          store.put(reviews);
        }

        return tx.complete;
      });
    }

    /**
    * Toggle restaurant favourite
    */

  }, {
    key: "saveRestaurantFavoriteToDatabase",
    value: function saveRestaurantFavoriteToDatabase(isFavorite, restaurantId) {
      var dbPromise = DBHelper.openDatabase();

      /* Store data in database */
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction("restaurantsList", "readwrite");
        var store = tx.objectStore("restaurantsList");
        store.get(restaurantId).then(function (restaurant) {
          restaurant['is_favorite'] = isFavorite.toString();
          store.put(restaurant);
        });
      });
    }

    /**
    * Send reviews to the Server and save to Database.
    */

  }, {
    key: "sendRestaurantFavoriteToServer",
    value: function sendRestaurantFavoriteToServer(restaurantId, isFavorite) {

      console.log('Updating Restaurant Favorite : ', isFavorite);
      var url = "http://localhost:1337/restaurants/" + restaurantId + "/?is_favorite=" + isFavorite;

      fetch(url, { method: 'PUT' }).then(function (response) {
        return response.json();
      }).then(function (data) {
        console.log("Saved favorite successfully");
        DBHelper.saveRestaurantFavoriteToDatabase(isFavorite, restaurantId);
      }).catch(function (error) {
        return console.log('error:', error);
      });
    }

    /**
    * Send reviews to the Server and save to Database.
    */

  }, {
    key: "sendReviewToServer",
    value: function sendReviewToServer(reviewData) {

      console.log('Sending Reviews : ', reviewData);
      var fetch_options = {
        method: 'POST',
        body: JSON.stringify(reviewData),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
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
    key: "saveReviewsTolocalStorage",
    value: function saveReviewsTolocalStorage(offlineReviewsList) {
      window.localStorage.setItem("reviews", JSON.stringify(offlineReviewsList));
    }
  }, {
    key: "saveRestaurantTolocalStorage",
    value: function saveRestaurantTolocalStorage(offlineRestaurantList) {
      window.localStorage.setItem("restaurant_favorite", JSON.stringify(offlineRestaurantList));
    }
  }, {
    key: "getRestaurantsFromlocalStorage",
    value: function getRestaurantsFromlocalStorage(id) {
      var offlineRestaurantFav = [];
      var offlineRestaurantFavList;

      //get the reviews from local storage , send them and delete it from the local  storage 
      if (window.localStorage.getItem("restaurant_favorite") !== null) {
        offlineRestaurantFavList = JSON.parse(window.localStorage.getItem("restaurant_favorite"));

        for (var i = 0; i < offlineRestaurantFavList.length; i++) {
          if (offlineRestaurantFavList[i]['id'] === id) {
            if (window.navigator.onLine) {
              var id = offlineRestaurantFavList[i].id;
              var fav = offlineRestaurantFavList[i]['is_favorite'];
              DBHelper.sendRestaurantFavoriteToServer(id, fav);
            }
            offlineRestaurantFav.push(offlineRestaurantFavList[i]);
            offlineRestaurantFavList.splice(i, 1);
          }
          localStorage["restaurant_favorite"] = JSON.stringify(offlineRestaurantFavList);
        }
      }
      return offlineRestaurantFav;
    }
  }, {
    key: "getReviewsFromlocalStorage",
    value: function getReviewsFromlocalStorage(id) {
      var offlineReviews = [];
      var offlineReviewsList;

      //get the reviews from local storage , send them and delete it from the local  storage 
      if (window.localStorage.getItem("reviews") !== null) {
        offlineReviewsList = JSON.parse(window.localStorage.getItem("reviews"));

        for (var i = 0; i < offlineReviewsList.length; i++) {
          if (offlineReviewsList[i]['restaurant_id'] === id) {
            if (window.navigator.onLine) DBHelper.sendReviewToServer(offlineReviewsList[i]);
            offlineReviews.push(offlineReviewsList[i]);
            offlineReviewsList.splice(i, 1);
          }
          localStorage["reviews"] = JSON.stringify(offlineReviewsList);
        }
      }
      return offlineReviews;
    }

    /**
    * Fetch a restaurant by its ID.
    */

  }, {
    key: "fetchRestaurantById",
    value: function fetchRestaurantById(id, callback) {
      // fetch all restaurants with proper error handling.
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var restaurant = restaurants.find(function (r) {
            return r.id == id;
          });

          if (restaurant) {
            // Got the restaurant
            callback(null, restaurant);
          } else {
            // Restaurant does not exist in the database
            callback("Restaurant does not exist", null);
          }
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisine",
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants(function (error, restaurants) {

        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByNeighborhood",
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisineAndNeighborhood",
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;
          if (cuisine != "all") {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }
          if (neighborhood != "all") {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: "fetchNeighborhoods",
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          });
          // Remove duplicates from neighborhoods
          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: "fetchCuisines",
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          });
          // Remove duplicates from cuisines
          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: "urlForRestaurant",
    value: function urlForRestaurant(restaurant) {
      return "./restaurant.html?id=" + restaurant.id;
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: "imageUrlForRestaurant",
    value: function imageUrlForRestaurant(restaurant) {
      return "/img/" + restaurant.photograph + ".webp";
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: "mapMarkerForRestaurant",
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
    key: "DATABASE_URL",


    /**
    * Database URL.
    */
    get: function get() {
      var port = 1337; // Changed this to your server port
      return "http://localhost:" + port + "/";
    }
  }]);

  return DBHelper;
}();