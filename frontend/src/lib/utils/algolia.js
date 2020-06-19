import algoliasearch from 'algoliasearch/lite';

const algoliaClient = algoliasearch(
    '6OW1B8K1KD',
    'b541757295fac3492ed3a1041a5ed003',
    
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
  