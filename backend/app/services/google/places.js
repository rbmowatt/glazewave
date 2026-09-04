const axios = require('axios');
const googleConfig = require('./../../config/google');

const DETAILS_URL = 'https://places.googleapis.com/v1/places';

// Places API (New) has no default field set - omitting the mask is an error,
// not a full response - and you are billed at the highest SKU any requested
// field belongs to. These six are all Essentials tier.
const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'googleMapsUri',
  'location',
].join(',');

async function placeDetails(placeId) {
  if (!googleConfig.MAPS_KEY) {
    throw new Error('GOOGLE_MAPS_KEY is not set');
  }
  try {
    const resp = await axios.get(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': googleConfig.MAPS_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
    });
    return resp.data;
  } catch (err) {
    // Axios reports only "Request failed with status code 403". Google puts the
    // reason that actually matters - API not enabled, key restriction rejected
    // the caller, referrer-restricted key used server side - in the body.
    const detail = err.response && err.response.data && err.response.data.error;
    if (detail) {
      throw new Error(`Places API ${detail.status || err.response.status}: ${detail.message}`);
    }
    throw err;
  }
}

// The legacy details payload is gone and the column names no longer line up
// with it: `vicinity` was dropped, and shortFormattedAddress is its nearest
// equivalent; `url` is now googleMapsUri. lat/lng are VARCHAR on locations, so
// stringify rather than leaning on sequelize to coerce the numbers.
function toLocation(place) {
  return {
    id: place.id,
    name: place.displayName ? place.displayName.text : null,
    formatted_address: place.formattedAddress || null,
    lat: place.location ? String(place.location.latitude) : null,
    lng: place.location ? String(place.location.longitude) : null,
    vicinity: place.shortFormattedAddress || null,
    url: place.googleMapsUri || null,
  };
}

module.exports = { placeDetails, toLocation };
