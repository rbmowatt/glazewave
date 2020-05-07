import React, { Component } from 'react'
//import logo from './logo.svg'
import './Home.css'
import { connect } from 'react-redux'

const mapStateToProps = state => {
}

function mapDispatchToProps (dispatch) {
}

class Page404 extends Component {
  componentDidMount () {
  }
  
  render () {
    return (
      <div className="Home">
        <header className="Home-header">
          <p>404 Page Not Found</p>
        </header>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Page404)