"use strict";

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

var Restaurants = void 0,
    resetRestaurants = void 0,
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
  DBHelper.fetchNeighborhoods().then(function (neighborhoods) {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }).catch(function (error) {
    return console.error(error);
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
  DBHelper.fetchCuisines().then(function (cuisines) {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  }).catch(function (error) {
    return console.log(error);
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

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(function (restaurants) {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  }).catch(function (error) {
    return console.error(error);
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

  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.id;

  /**
  * Add srcset for images based on Device Pixel Ratio
  */
  var small_images = restaurant_photograph + "-1x.webp";
  var large_images = restaurant_photograph + "-2x.webp";

  // LAZY LOADING  OF IMAGES
  var options = {
    threshold: 0.2
  };

  var observer = void 0;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(events, options);
    observer.observe(image);
  } else {
    //Just load images as it is without lazy loading
    displayImages(image);
  }
  var displayImages = function displayImages(image) {
    image.className = 'restaurant-img';
    image.classNmae = "sunitha";
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = "images/" + small_images + " 1x" + "," + "images/" + large_images + " 2x";
    image.src = "img/" + restaurant_photograph + ".jpg";
    image.sizes = "(max-width: 325px) 100vw 50vw";
  };

  function events(events, observer) {
    events.forEach(function (event) {
      if (event.intersectionRatio > 0) {
        //Display images
        displayImages(event.target);
        observer.unobserve(event.target);
      } else {}
    });
  }

  li.append(image);

  var div = document.createElement("div");
  li.append(div);

  var name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  div.append(name);

  var fav = document.createElement("img");
  fav.setAttribute('tabIndex', 0);
  changeFavIcon(fav, restaurant['is_favorite']);

  var anchor = document.createElement("a");
  anchor.onclick = function () {
    var isFavNow = !restaurant['is_favorite'];
    DBHelper.updateFavouriteStatus(restaurant.id, isFavNow);
    restaurant.is_favorite = !restaurant.is_favorite;
    changeFavIcon(fav, JSON.parse(restaurant.is_favorite));
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

changeFavIcon = function changeFavIcon(el, isFav) {
  if (!isFav) {
    el.src = "icons/unlike.svg";
    el.alt = "add to favorite";
    el.title = "add to favourite";
  } else {
    el.src = "icons/like.svg";
    el.alt = "remove from favorite";
    el.title = "remove from favourite";
  }
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