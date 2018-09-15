/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*global newMap ,initMap ,DBHelper, getParameterByName,fillBreadcrumb ,createReviewHTML,fillRestaurantHoursHTML,fillRestaurantHTML,fillReviewsHTML,fetchRestaurantFromURL,fetchRestaurantById,error */

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

let restaurant,reviews,initMap,fetchRestaurantFromURL,fillRestaurantHTML,getParameterByName,fillRestaurantHoursHTML,fillReviewsHTML,createReviewHTML,fillBreadcrumb,event;
var newMap, addReview;
var offlineReviews = [];
var offlineReviewsFromLocalStorage = [];

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL()
    .then(restaurant => {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoibXJwdW1wa2luZyIsImEiOiJjamoyNXUzcDIwenpyM2tsZm03MDJnOHFqIn0.K5wTgEieIuewCzBwoLVGRw',
        maxZoom: 18,
        attribution: '',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    })
    .catch(error => console.error(error));
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    return Promise.resolve(self.restaurant);
  }
  const id = parseInt(getParameterByName('id'));
  if (!id || id === NaN) { // no id found in URL
    return Promise.reject('No restaurant id in URL')
  } else {
    return DBHelper.fetchRestaurantById(id)
      .then(restaurant => {
        if (!restaurant) {
          return Promise.reject(`Restaurant with ID ${id} was not found`)
        }
        self.restaurant = restaurant;
        fillRestaurantHTML();
        return restaurant;
      });
  }
}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
 // image.className = "restaurant-img";
  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.id;

//  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  
  var small_images = (restaurant_photograph) + ("_300.webp");
  var large_images = (restaurant_photograph) + ("_600.webp");

  /**
  * Add srcset and sizes attributes for images
  */
  
 // image.srcset = "banners/" + large_images + " 600w" + "," +  "banners/" + small_images +  " 300w";
 // image.src = "banners/"+ large_images;
  image.sizes = "(max-width: 325px) 100vw 50vw";

  // LAZY LOADING  OF IMAGES
  const options = {
    threshold: 0.2
  };

  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(events, options);
    observer.observe(image);

  } else {
    //Just load images as it is without lazy loading
    displayImages(image);
  }
  const displayImages = image => {
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = "banners/" + small_images + " 1x" + "," +  "banners/" + large_images +  " 2x";
    // image.src = "banners/"+ large_images;
  
  }

  function events(events, observer) {
    events.forEach(event => {
      if (event.intersectionRatio > 0) {
        //Display images
        displayImages(event.target);
        observer.unobserve(event.target);
      } else {
        
      }
    });
  }  

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  DBHelper.fetchReviewsByRestaurantId(restaurant.id)
      .then(reviews => fillReviewsHTML(reviews))
};



/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  //self.restaurant.reviews = reviews;
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);
  var id = parseInt(getParameterByName('id'));
  //Get reviews from local storage if they are added  when offline
  // var offlineReviewsFromLocalStorage = DBHelper.getReviewsFromlocalStorage(id);
  
  // if(offlineReviewsFromLocalStorage !== undefined && offlineReviewsFromLocalStorage.length !== 0){
  //   var offlineReviews = (offlineReviewsFromLocalStorage);
  //   var reviews = reviews.concat(offlineReviews);
  // }


  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));

  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement("li");
  li.tabIndex = 0;
  const name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement("p");
  var convertedDate = (new Date(review.createdAt)).toLocaleString();

  date.innerHTML = convertedDate;
  li.appendChild(date);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

addReview = () => {


  console.log("clicked submit");


  
  var url = window.location.href;
  var id = getParameterByName('id');
  
  var name = document.getElementById('reviewer_name').value;
  var rating = document.getElementById('select_rating');
  var rating_value = rating.options[rating.selectedIndex].value;
  var comment = document.getElementById('reviewer_comment').value;
   
  if (name == "") {
      alert("Name must be filled out");
      return false;
  }else if(comment == ""){
      alert("Comment must be filled out");
      return false;
  }
  else {
     var jsonToSend = {
      "restaurant_id": id,
      "name": name,
      "createdAt": new Date(),
      "rating": rating_value,
      "comments":comment
    }

    var offline_obj ={
      data: jsonToSend,
      name: 'addReview',
      object_type: "review"
    }

    //code for offline 
    if(!navigator.onLine && (offline_obj.name === 'addReview')){
      DBHelper.sendReviewsWhenOnline(offline_obj);
        const container = document.getElementById("reviews-container");
        const ul = document.getElementById("reviews-list");
        ul.insertBefore(createReviewHTML(offline_obj.data), ul.childNodes[0]);
        container.appendChild(ul);

        var reviewForm = document.getElementById('reviewForm');
        reviewForm.reset();

        return;
    }

    //code for online 
    console.log("sending reviews" , jsonToSend);
    DBHelper.sendReviewsToServer(jsonToSend);

    const container = document.getElementById("reviews-container");
    const ul = document.getElementById("reviews-list");
    ul.insertBefore(createReviewHTML(jsonToSend), ul.childNodes[0]);
    container.appendChild(ul);

    var reviewForm = document.getElementById('reviewForm');
    reviewForm.reset();

  }

}

 
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
