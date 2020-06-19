import React from 'react';
import { connectHits } from 'react-instantsearch-dom';
import { isDOMComponent } from 'react-dom/test-utils';

const Hits = (data) => { 
    if(data.handle)
    {
        const ids =[];
        data.hits.forEach(hit=> ids.push(hit.id))
        data.handle(ids)
    }
   return  (
        <ol>
     
        </ol>
      );}

const SearchHits = connectHits(Hits);
export default SearchHits;