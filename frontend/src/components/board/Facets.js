import "./css/Facets.css";
import React from "react";
import { connect } from "react-redux";
import {
  RefinementList,
  Configure,
} from "react-instantsearch-dom";
import SearchResults from "./../algolia/SearchResults";

function mapStateToProps(state) {
  return { session: state.session };
}

class Facets extends React.Component {
  render() {
    const filters =
    this.props.showAll === "1"
      ? "user_id=" + this.props.session.user.id + " OR is_public=1"
      : "user_id=" + this.props.session.user.id;
    return (
      <div>
        <h6>Manufacturers</h6>
        <div>
          <RefinementList
            key="rl1"
            container="#sessions"
            attribute="manufacturer"
          />
        </div>
        <h6>Models</h6>
        <div>
          <RefinementList
            key="rl1"
            container="#sessions"
            attribute="model"
            showMoreLimit={3}
          />
        </div>
        <Configure hitsPerPage={this.props.hitsPerPage} filters={filters} />
        <SearchResults onChange={this.props.onSelect} key="sr2" />
      </div>
    );
  }
}

export default connect(mapStateToProps)(Facets);
