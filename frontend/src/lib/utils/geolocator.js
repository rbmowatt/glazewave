import googleConfig from './../../config/google';


window.geolocator.config({
  language: 'en',
  google: {
    version: '3',
    key: googleConfig.api_key,
  },
});

export const locator = window.geolocator;

// addressLookup is off on purpose. It calls the Geocoding *web service*
// (maps/api/geocode/json) straight from the browser, and Google refuses a
// referrer-restricted key on web-service endpoints - "API keys with referer
// restrictions cannot be used with this API" - so there is no key setting that
// makes it work from here. Every caller reads only location.coords, so the
// formatted address it fetched was never used by anything.
export const defaultOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumWait: 15000,
  maximumAge: 0,
  desiredAccuracy: 5000,
  fallbackToIP: true,
  addressLookup: false,
};

// geolocator can throw synchronously rather than calling back, so callers must
// not invoke locate() directly from a lifecycle method.
export function safeLocate(options, cb) {
  try {
    window.geolocator.locate(options, cb);
  } catch (err) {
    cb(err, null);
  }
}
