import React from 'react';
import { connectStateResults } from 'react-instantsearch-dom';

const StateResults = ({
    searchState,
    searchResults,
    allSearchResults,
    error,
    searching,
    searchingForFacetValues,
    isSearchStalled,
    onChange
  }) => {
      if(!searching && searchResults)
      {
        const ids =[];
        searchResults.hits.forEach(hit=> ids.push(hit.id))
        if(onChange)
        {
            onChange(ids)
        }
      }
    return null
  };

  const SearchResults = connectStateResults(StateResults);
  export default SearchResults;