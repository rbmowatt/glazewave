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
  
const searchClient = {
      search(requests) {
        const shouldSearch = requests.some(({ params: { query }}) => query !== '');
        if (shouldSearch) {
          return algoliaClient.search(requests);
        }
        return Promise.resolve({
          results: [{ hits: [] }],
        });
      },
      searchForFacetValues: algoliaClient.searchForFacetValues,
    };

export default searchClient;
  