import algoliasearch from 'algoliasearch/lite';
import { createInMemoryCache } from '@algolia/cache-in-memory';
require('dotenv').config();

const algoliaClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_CLIENT_SECRET,
  {
    // Caches responses from Algolia
    responsesCache: createInMemoryCache(),
    // Caches Promises with the same request payload
    requestsCache: createInMemoryCache({ serializable: false }), // or createNullCache()
  },
);

const index = algoliaClient.initIndex('surfline_spots');



const getSpots = (lat, lon)=>
{
    return index.search('', {
        aroundLatLng: `${lat}, ${lon}`,
        aroundRadius: 10000 // 1000 km
      })
}

export default getSpots;
  
