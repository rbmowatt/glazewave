import googleConfig from './../../config/google';

window.geolocator.config({
    language: "en",
    google: {
      version: "3",
      key: googleConfig.api_key,
    },
  });
 
  export const locator = window.geolocator;
  export const defaultOptions = {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumWait: 10000, // max wait time for desired accuracy
    maximumAge: 0, // disable cache
    desiredAccuracy: 30, // meters
    fallbackToIP: true, // fallback to IP if Geolocation fails or rejected
    addressLookup: true, // requires Google API key if true
  };
