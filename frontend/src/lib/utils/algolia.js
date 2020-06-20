import algoliasearch from 'algoliasearch/lite';
require('dotenv').config();

const algoliaClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_CLIENT_SECRET
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
  