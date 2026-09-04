import googleConfig from './../../config/google';

const hasGoogleKey = Boolean(googleConfig.api_key);

window.geolocator.config({
  language: 'en',
  google: {
    version: '3',
    key: googleConfig.api_key,
  },
});

export const locator = window.geolocator;

// addressLookup calls the Google Geocoding API. With no key or an invalid one
// the library raises GeoError outside the locate() callback, which escapes
// componentDidMount and unmounts the whole React tree.
export const defaultOptions = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumWait: 10000,
  maximumAge: 0,
  desiredAccuracy: 30,
  fallbackToIP: true,
  addressLookup: hasGoogleKey,
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
