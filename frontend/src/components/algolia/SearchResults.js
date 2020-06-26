import React from 'react';
import { connectStateResults } from 'react-instantsearch-dom';

class StateResults extends React.Component{
  constructor({
    searchState,
    searchResults,
    allSearchResults,
    error,
    searching,
    searchingForFacetValues,
    isSearchStalled,
    onChange
  })
  {
    super();
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    if(!this.props.searching && this.props.searchResults)
    {
      const ids =[];
      this.props.searchResults.hits.forEach(hit=> ids.push(hit.id))
      if(this.props.onChange)
      {
          this.props.onChange(ids)
      }
    }
  }
  render(args)
  {
    //just push something out here to satisfy render
    return ''
  }
}

  const SearchResults = connectStateResults(StateResults);
  export default SearchResults;