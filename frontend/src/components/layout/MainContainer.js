import React from 'react'
import { connect } from 'react-redux'
import Loader from 'react-loader';

function mapStateToProps(state) {
    return { api: state.api };
} 

class MainContainer extends React.Component{
    render()
    {
        return (
            <header className="background rgba-black-strong">
                <div className="container main-container ">
                <Loader loaded={this.props.api === 0}>
                        { this.props.children }
                </Loader>
                </div>
            </header>
        )
    }
}   

export default connect(mapStateToProps)(MainContainer)