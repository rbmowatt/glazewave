import './css/Facets.css'
import React from 'react'
import { connect } from 'react-redux'
import { InstantSearch, RefinementList , Configure, ClearRefinements,  CurrentRefinements } from 'react-instantsearch-dom';
import searchClient from './../../lib/utils/algolia'
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
            <h6>Boards</h6>
            <div>
            <RefinementList 
            key="rl1"
            container="#sessions"
            attribute="board"
            />
            </div>
            <h6>Locations</h6>
            <div>
            <RefinementList 
            key="rl1"
            container="#sessions"
            attribute="location"
            />
            </div>
            <h6>Rating</h6>
            <div>
            <RefinementList 
            key="rl2"
            container="#sessions"
            attribute="rating"
            limit={10}
            showMore={true}
            showMoreLimit={3}
            //searchable={true}
            //searchableIsAlwaysActive={true} 
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