import React, { Component } from 'react'
import './Home.css'
import { connect } from 'react-redux'

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

export default connect()(Page404)