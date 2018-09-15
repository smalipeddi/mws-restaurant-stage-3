/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* eslint event: "off"*/
/**
 * Common database helper functions.
 */

//import idb from 'idb';
const dbPromise = idb.open('db', 2, function(upgradeDb) {
  switch (upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurantsList', {
         keyPath: 'id'
    });
    case 1:
      const reviewsStore = upgradeDb.createObjectStore('reviewsList', {
        keyPath: 'id'
    });
          reviewsStore.createIndex('restaurant', 'restaurant_id');
  }
});
  

class DBHelper {

  /**
  * Database URL.
  */
  static get DATABASE_URL() {
    const port = 1337; // Changed this to your server port
    return `http://localhost:${port}/`;
  }


  /**
  * Fetch all restaurants
  */
  static fetchRestaurants() {
    return dbPromise
      .then(db => {
        const tx = db.transaction('restaurantsList');
        const restaurantStore = tx.objectStore('restaurantsList');
        return restaurantStore.getAll();
      })
      .then(restaurants => {
        if (restaurants.length !== 0) {
          return restaurants;
        }
        return fetch(DBHelper.DATABASE_URL + 'restaurants')
      .then(response => response.json())
      .then(restaurants => {
        return dbPromise
          .then(db => {
            const tx = db.transaction('restaurantsList', 'readwrite');
            const restaurantStore = tx.objectStore('restaurantsList');
            restaurants.forEach(restaurant => restaurantStore.put(restaurant));
             tx.complete;
             return restaurants;
          });
      });
    });
  }

  /**
  * Fetch all reviews by restaurant id
  */
  static fetchReviewsByRestaurantId(id) {

    return  fetch(DBHelper.DATABASE_URL + "reviews/?restaurant_id=" + id, {method: "GET"})
        .then(resp => resp.json())
        .then(reviews => {
          dbPromise
          .then(db => {
            if(!db) return ;
            let tx = db.transaction('reviewsList' ,'readwrite');
            const reviewsStore = tx.objectStore('reviewsList');
            if (Array.isArray(reviews)) {  //store array of reviews from server
              reviews.forEach(function(review) {
                reviewsStore.put(review);
              });
            } else {
              reviewsStore.put(reviews);
            }
            
          });
          console.log("reviews from servre" ,reviews);
            return (reviews);
           
          })
          .catch(error => {
            return DBHelper.cacheReviewsFromDb(id);
          });
    }

   /**
   * Send reviews to the Server and save to Database.
   */

   static sendReviewsToServer(jsonData){

    var fetch_options = {
       method :'POST',
       body: JSON.stringify(jsonData),
       headers: new Headers({'Content-Type': 'application/json'})
    }

    fetch("http://localhost:1337/reviews", fetch_options).then(function (response) {
        return response.json();
      }).then(function (data) {
        console.log("Saved reviews successfully");
        DBHelper.saveReviewsToDatabase(data);
      }).catch(function (error) {
        return console.log('error:', error);
      });

    
  }

  static sendReviewsWhenOnline(data){
    
    DBHelper.saveReviewsTolocalStorage(data);
    console.log("saving data to local storage", data);
    window.addEventListener('online', (event) => {
      console.log("online again");
      var offLineData = DBHelper.getReviewsFromlocalStorage();
      console.log(offLineData);
      if(offLineData !== null){
        offLineData.forEach(reviewObj => {
            DBHelper.sendReviewsToServer(reviewObj.data);
        });
        
      }
      console.log('LocalStorage data sent to server');
      localStorage.removeItem('reviews');
      console.log("localStorage + ${offLineData.object_type}   removed");
    });

   
  }

  static saveReviewsToDatabase(reviews){
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

  static saveReviewsTolocalStorage(offlineReviewsList){
     var existing = localStorage.getItem('reviews');
     existing = existing ? JSON.parse(existing) : [];
     existing.push(offlineReviewsList);
     window.localStorage.setItem("reviews" , JSON.stringify(existing));

  }

  static getReviewsFromlocalStorage(){
    return JSON.parse(window.localStorage.getItem("reviews"));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
     return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.find(r => r.id === id));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants().
      then(restaurants => restaurants.filter(r => r.cuisine_type == cuisine));
      
  }
  
  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(
        restaurants => restaurants.filter(r => r.neighborhood == neighborhood));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        return uniqueNeighborhoods;
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        return uniqueCuisines;
      });
  }


 static updateFavouriteStatus(restaurantId, isFavourite) {
    console.log('changing favorite status to: ', isFavourite);

    fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavourite}`, {
        method: 'PUT'
      })
      .then(() => {
        dbPromise
          .then(db => {
            const tx = db.transaction('restaurantsList', 'readwrite');
            const restaurantsStore = tx.objectStore('restaurantsList');
            restaurantsStore.get(restaurantId)
              .then(restaurant => {
                restaurant.is_favorite = isFavourite;
                restaurantsStore.put(restaurant);
              });
          })
      })

  }

  /**
  * Cache Reviews from Database
  */
  static cacheReviewsFromDb(id){
    
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
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
    marker.addTo(newMap);
    return marker;
  } 

}

