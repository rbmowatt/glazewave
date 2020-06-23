import React from 'react';
import { connectSortBy } from 'react-instantsearch-dom';
import { Select, Radio } from "react-advanced-form-addons";
import { Form } from "react-advanced-form";

class SB extends React.Component{
  constructor({ items, refine, createURL })
  {
    super();
  }

  componentDidUpdate(prevProps, prevState, snapshot){
      if(prevProps.currentRefinement !== this.props.currentRefinement){
          this.props.onSortUpdated(this.props.currentRefinement);
      }
   
  }

  render()
  {    

    return <Form><Select  onChange={event => {
       // event.preventDefault();
       // console.log(event)
        this.props.refine(event.nextValue);
      }}>
       {this.props.items.map(item => (
      <option key={item.value} value={item.value}>

          {item.label}
     
      </option>
    ))}
    </Select></Form>

    return <ul >
    {this.props.items.map(item => (
      <li key={item.value} >
        <a
          href={this.props.createURL(item.value)}
          style={{ fontWeight: item.isRefined ? 'bold' : '' }}
          onClick={event => {
            event.preventDefault();
            this.props.refine(item.value);
          }}
        >
          {item.label}
        </a>
      </li>
    ))}
  </ul>
  }
}

const SortBy = connectSortBy(SB);
export default SortBy