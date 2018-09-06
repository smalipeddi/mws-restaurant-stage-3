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
        return DBHelper.cacheDataFromDb().then(function (restaurants) {
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
    key: "cacheDataFromDb",
    value: function cacheDataFromDb() {
      var dbPromise = DBHelper.openDatabase();

      var restaurants = dbPromise.then(function (db) {
        var tx = db.transaction("restaurantsList", "readonly");
        var store = tx.objectStore("restaurantsList");
        return store.getAll();
      });

      return restaurants;
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

        var dbPromise = DBHelper.openDatabase();
        var reviews = dbPromise.then(function (db) {
          var tx = db.transaction("reviewsList", "readonly");
          var store = tx.objectStore("reviewsList");
          return store.getAll(id);
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
    key: "saveRestaurantsToDatabase",
    value: function saveRestaurantsToDatabase(restaurants) {
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

      fetch("http://localhost:1337/restaurants/" + restaurantId + "/?is_favorite=" + isFavorite, {
        method: 'PUT'
      }).then(function () {
        var dbPromise = DBHelper.openDatabase();
        /* Store data in database */
        dbPromise.then(function (db) {
          if (!db) return;
          var tx = db.transaction("restaurantsList", "readwrite");
          var store = tx.objectStore("restaurantsList");
          store.get(restaurantId).then(function (restaurantById) {
            restaurantById.is_favorite = isFavorite;
            store.put(restaurantById);
          });
        });
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
        console.log("sunitja");
        console.log(data);
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
    key: "getReviewsFromlocalStorage",
    value: function getReviewsFromlocalStorage(id) {
      var offlineReviews = [];
      var offlineReviewsList;

      //get the reviews from local storage , send them and delete it from the local  storage 
      if (window.localStorage.getItem("reviews") !== null) {
        offlineReviewsList = JSON.parse(window.localStorage.getItem("reviews"));
        console.log(offlineReviewsList);
        for (var i = 0; i < offlineReviewsList.length; i++) {
          if (offlineReviewsList[i]['restaurant_id'] === id) offlineReviews.push(offlineReviewsList[i]);
          offlineReviewsList.splice(i, 1);
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
"use strict";

(function () {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function (resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function (value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function (prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function get() {
          return this[targetProp][prop];
        },
        set: function set(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function (prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function () {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function (prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function () {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function (prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function () {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, "_index", ["name", "keyPath", "multiEntry", "unique"]);

  proxyRequestMethods(Index, "_index", IDBIndex, ["get", "getKey", "getAll", "getAllKeys", "count"]);

  proxyCursorRequestMethods(Index, "_index", IDBIndex, ["openCursor", "openKeyCursor"]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, "_cursor", ["direction", "key", "primaryKey", "value"]);

  proxyRequestMethods(Cursor, "_cursor", IDBCursor, ["update", "delete"]);

  // proxy 'next' methods
  ["advance", "continue", "continuePrimaryKey"].forEach(function (methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function () {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function () {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function (value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function () {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function () {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, "_store", ["name", "keyPath", "indexNames", "autoIncrement"]);

  proxyRequestMethods(ObjectStore, "_store", IDBObjectStore, ["put", "add", "delete", "clear", "get", "getAll", "getKey", "getAllKeys", "count"]);

  proxyCursorRequestMethods(ObjectStore, "_store", IDBObjectStore, ["openCursor", "openKeyCursor"]);

  proxyMethods(ObjectStore, "_store", IDBObjectStore, ["deleteIndex"]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function (resolve, reject) {
      idbTransaction.oncomplete = function () {
        resolve();
      };
      idbTransaction.onerror = function () {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function () {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function () {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, "_tx", ["objectStoreNames", "mode"]);

  proxyMethods(Transaction, "_tx", IDBTransaction, ["abort"]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function () {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, "_db", ["name", "version", "objectStoreNames"]);

  proxyMethods(UpgradeDB, "_db", IDBDatabase, ["deleteObjectStore", "close"]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function () {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, "_db", ["name", "version", "objectStoreNames"]);

  proxyMethods(DB, "_db", IDBDatabase, ["close"]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ["openCursor", "openKeyCursor"].forEach(function (funcName) {
    [ObjectStore, Index].forEach(function (Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace("open", "iterate")] = function () {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function () {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function (Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function (query, count) {
      var instance = this;
      var items = [];

      return new Promise(function (resolve) {
        instance.iterateCursor(query, function (cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function open(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, "open", [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function (event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function (db) {
        return new DB(db);
      });
    },
    delete: function _delete(name) {
      return promisifyRequestCall(indexedDB, "deleteDatabase", [name]);
    }
  };

  if (typeof module !== "undefined") {
    module.exports = exp;
    module.exports.default = module.exports;
  } else {
    self.idb = exp;
  }
})();
"use strict";

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

var Restaurants = void 0,
    addMarkersToMap = void 0,
    createRestaurantHTML = void 0,
    neighborhoods = void 0,
    updateRestaurants = void 0,
    updateRestaurant = void 0,
    event = void 0,
    initMap = void 0,
    fetchNeighborhoods = void 0,
    fillNeighborhoodsHTML = void 0,
    fetchCuisines = void 0,
    fillCuisinesHTML = void 0,
    fillRestaurantsHTML = void 0,
    cuisines = void 0,
    newMap = void 0,
    markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", function (event) {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = function fetchNeighborhoods() {
  DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = function fillNeighborhoodsHTML() {
  var neighborhoods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.neighborhoods;

  var select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(function (neighborhood) {
    var option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = function fetchCuisines() {
  DBHelper.fetchCuisines(function (error, cuisines) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = function fillCuisinesHTML() {
  var cuisines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.cuisines;

  var select = document.getElementById("cuisines-select");

  cuisines.forEach(function (cuisine) {
    var option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = function initMap() {
  newMap = L.map("map", {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ", {
    mapboxToken: "pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ",
    maxZoom: 18,
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, " + "<a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " + "Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    id: "mapbox.streets"
  }).addTo(newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = function updateRestaurants() {
  var cSelect = document.getElementById("cuisines-select");
  var nSelect = document.getElementById("neighborhoods-select");

  var cIndex = cSelect.selectedIndex;
  var nIndex = nSelect.selectedIndex;

  var cuisine = cSelect[cIndex].value;
  var neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, function (error, restaurants) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = function resetRestaurants(restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  var ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(function (marker) {
      return marker.remove();
    });
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = function fillRestaurantsHTML() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  var ul = document.getElementById("restaurants-list");
  restaurants.forEach(function (restaurant) {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = function createRestaurantHTML(restaurant) {
  var li = document.createElement("li");

  li.role = "listitem";
  li.tabIndex = 0;
  var image = document.createElement("img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.id;

  /**
  * Add srcset for images based on Device Pixel Ratio
  */
  var small_images = restaurant_photograph + "-1x.webp";
  var large_images = restaurant_photograph + "-2x.webp";
  image.srcset = "images/" + small_images + " 1x" + "," + "images/" + large_images + " 2x";

  image.src = "img/" + restaurant_photograph;
  image.sizes = "(max-width: 325px) 100vw 50vw";
  li.append(image);

  var div = document.createElement("div");
  li.append(div);

  var name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  div.append(name);

  var fav = document.createElement("img");
  if (restaurant.is_favorite === "true") {
    fav.src = "icons/like.svg";
    fav.alt = "add to favorite";
  } else {
    fav.src = "icons/unlike.svg";
    fav.alt = "remove from favorite";
  }

  var anchor = document.createElement("a");
  anchor.onclick = function () {
    if (restaurant.is_favorite === "true") {
      fav.src = "icons/unlike.svg";
      fav.alt = "remove from favorite";
      if (restaurant.hasOwnProperty('is_favorite')) {
        restaurant.is_favorite = "false";
      }

      // DBHelper.saveRestaurantFavoriteToDatabase(restaurant.is_favorite , restaurant.id);
    } else {
      fav.src = "icons/like.svg";
      fav.alt = "add to favorite";
      if (restaurant.hasOwnProperty('is_favorite')) {
        restaurant.is_favorite = "true";
      }
      // restaurant.is_favourite = "true";
    }
    DBHelper.saveRestaurantFavoriteToDatabase(restaurant.is_favorite, restaurant.id);

    this.append(fav);
  };
  anchor.append(fav);

  div.append(anchor);

  var neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  div.append(neighborhood);

  var address = document.createElement("p");
  address.innerHTML = restaurant.address;
  div.append(address);

  //Change link to a button 
  var more = document.createElement("button");
  more.innerHTML = "View Details";
  more.onclick = function () {
    var url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;
  };
  div.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = function addMarkersToMap() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  restaurants.forEach(function (restaurant) {
    // Add marker to the map
    var marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};
"use strict";

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*global newMap ,initMap ,DBHelper, getParameterByName,fillBreadcrumb ,createReviewHTML,fillRestaurantHoursHTML,fillRestaurantHTML,fillReviewsHTML,fetchRestaurantFromURL,fetchRestaurantById,error */

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

var restaurant = void 0,
    initMap = void 0,
    fetchRestaurantFromURL = void 0,
    fillRestaurantHTML = void 0,
    getParameterByName = void 0,
    fillRestaurantHoursHTML = void 0,
    fillReviewsHTML = void 0,
    createReviewHTML = void 0,
    fillBreadcrumb = void 0,
    event = void 0;
var newMap;
var offlineReviews = [];
var offlineReviewsFromLocalStorage = [];

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", function (event) {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = function initMap() {
  fetchRestaurantFromURL(function (error, restaurant) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ", {
        mapboxToken: "pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ",
        maxZoom: 18,
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, " + "<a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " + "Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        id: "mapbox.streets"
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  var id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }

      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = function fillRestaurantHTML() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  var address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  var image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.className = "lazyload";
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));

  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.id;

  /**
  * Add srcset and sizes attributes for images
  */
  var small_images = restaurant_photograph + "_300.webp";
  var large_images = restaurant_photograph + "_600.webp";
  image.srcset = "banners/" + large_images + " 600w" + "," + "banners/" + small_images + " 300w";
  image.setAttribute('data-src', "banners/" + large_images);
  // image.src = "banners/"+ large_images;
  image.sizes = "(max-width: 325px) 100vw 50vw";

  var cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  DBHelper.fetchReviewsByRestaurantId(restaurant.id, fillReviewsHTML);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
  var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;

  var hours = document.getElementById("restaurant-hours");
  for (var key in operatingHours) {
    var row = document.createElement("tr");

    var day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    var time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = function fillReviewsHTML(error, reviews) {
  //self.restaurant.reviews = reviews;
  var container = document.getElementById("reviews-container");
  var title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);
  var id = parseInt(getParameterByName('id'));
  //Get reviews from local storage if they are added  when offline
  var offlineReviewsFromLocalStorage = DBHelper.getReviewsFromlocalStorage(id);

  if (offlineReviewsFromLocalStorage !== undefined && offlineReviewsFromLocalStorage.length !== 0) {
    var offlineReviews = offlineReviewsFromLocalStorage;
    // DBHelper.saveReviewsToDatabase(data);
    var reviews = reviews.concat(offlineReviews);
  }

  if (!reviews) {
    var noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  var ul = document.getElementById("reviews-list");
  reviews.forEach(function (review) {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = function createReviewHTML(review) {
  var li = document.createElement("li");
  li.tabIndex = 0;
  var name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  var date = document.createElement("p");
  var convertedDate = new Date(review.createdAt).toLocaleString();

  date.innerHTML = convertedDate;
  li.appendChild(date);

  var rating = document.createElement("p");
  rating.innerHTML = "Rating: " + review.rating;
  li.appendChild(rating);

  var comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

addReview = function addReview() {

  console.log("clicked submit");

  var url = window.location.href;
  var id = parseInt(getParameterByName('id'));

  var name = document.getElementById('reviewer_name').value;
  var rating = document.getElementById('select_rating');
  var rating_value = rating.options[rating.selectedIndex].value;
  var comment = document.getElementById('reviewer_comment').value;

  if (name == "") {
    alert("Name must be filled out");
    return false;
  } else if (comment == "") {
    alert("Comment must be filled out");
    return false;
  } else {
    var jsonToSend = {
      "restaurant_id": id,
      "name": name,
      "createdAt": new Date(),
      "rating": rating_value,
      "comments": comment
    };
    if (window.navigator.onLine) {

      // //see if there are any reviews in the local storage , if so save them into database and then access them .
      // var listofReviewsFromLocalStorage = DBHelper.getReviewsFromlocalStorage();
      // if(listofReviewsFromLocalStorage !== null || listofReviewsFromLocalStorage !== undefined){
      //     DBHelper.saveReviewsToDatabase(listofReviewsFromLocalStorage);
      // }

      DBHelper.sendReviewToServer(jsonToSend);
    } else {
      // If offline get the existing local storage and save data into local storage 
      var existing = localStorage.getItem('reviews');
      existing = existing ? JSON.parse(existing) : [];
      existing.push(jsonToSend);
      localStorage.setItem('reviews', JSON.stringify(existing));
    }

    var container = document.getElementById("reviews-container");
    var ul = document.getElementById("reviews-list");
    ul.insertBefore(createReviewHTML(jsonToSend), ul.childNodes[0]);
    container.appendChild(ul);

    var reviewForm = document.getElementById('reviewForm');
    reviewForm.reset();
  }
  return false;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = function fillBreadcrumb() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var breadcrumb = document.getElementById("breadcrumb");
  var li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};