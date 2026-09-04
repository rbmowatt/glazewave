import googleConfig from './../../config/google';

// react-google-maps-loader appends a fixed legacy script tag and cannot ask for
// the weekly channel, which is where AutocompleteSuggestion lives. This is the
// documented dynamic-import bootstrap instead, loaded once per page.
const CALLBACK = '__glazewaveMapsReady';

let placesPromise = null;

export const hasGoogleKey = () => Boolean(googleConfig.api_key);

function injectScript(key) {
  return new Promise((resolve, reject) => {
    window[CALLBACK] = () => resolve();
    const el = document.createElement('script');
    el.src =
      'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${CALLBACK}`;
    el.async = true;
    el.onerror = () => reject(new Error('Google Maps failed to load.'));
    document.head.appendChild(el);
  });
}

// Resolves with the places library, or rejects. Callers must handle the
// rejection: with no key the field has nothing to fall back on, and an
// unhandled throw here unmounts the React tree rather than blanking one input.
export function loadPlaces() {
  if (placesPromise) return placesPromise;
  const key = googleConfig.api_key;
  if (!key) {
    return Promise.reject(new Error('REACT_APP_GOOGLE_API_KEY is not set.'));
  }
  placesPromise = injectScript(key).then(() => window.google.maps.importLibrary('places'));
  return placesPromise;
}
