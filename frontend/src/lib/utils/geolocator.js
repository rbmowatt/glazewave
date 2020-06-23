window.geolocator.config({
    language: "en",
    google: {
      version: "3",
      key: "AIzaSyBaaD_720jqJaoIBsQib_N79Q5_iciLRBc",
    },
  });

  var options = {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumWait: 10000, // max wait time for desired accuracy
    maximumAge: 0, // disable cache
    desiredAccuracy: 30, // meters
    fallbackToIP: true, // fallback to IP if Geolocation fails or rejected
    addressLookup: true, // requires Google API key if true
    //timezone: true,         // requires Google API key if true
    //  map: "map-canvas",      // interactive map element id (or options object)
    //  staticMap: true         // get a static map image URL (boolean or options object)
  };
  
  const locator = window.geolocator;
  export default locator;