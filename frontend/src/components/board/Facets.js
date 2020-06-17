import './css/Facets.css'
import React from 'react'
import { connect } from 'react-redux'
import { RefinementList , Configure, ClearRefinements,  CurrentRefinements } from 'react-instantsearch-dom';
import SearchResults from './../layout/SearchResults'



function mapStateToProps(state) {
    return { api: state.api, session : state.session };
} 

class Facets extends React.Component{
    render()
    {
        return (
        <div>
            <h6><ClearRefinements /></h6>
            <h6>Models</h6>
            <div>
            <RefinementList 
            key="rl1"
            container="#sessions"
            attribute="model"
            />
            </div>
            <h6>Manufacturers</h6>
            <div>
            <RefinementList 
            key="rl1"
            container="#sessions"
            attribute="manufacturer"
            />
            </div>
            <Configure hitsPerPage={2000} 
                filters={"user_id:" + this.props.session.user.id } 
            />
            <SearchResults onChange={this.props.onSelect} key="sr1" />
           
            </div>
        )
    }
}   

export default connect(mapStateToProps)(Facets) 