import React, { Component } from 'react'
// import { withRouter } from "react-router-dom"
import { connect } from "react-redux"
import { Card } from '@blueprintjs/core'
import { getApiHealth } from '../../actions/health.actions'
import './App.css';

class App extends Component {

  componentDidMount() {
    this.props.getApiHealth()
  }

  render() {
    return (
      <div className="App">
        <Card className="App-Card">
          <h1>Hola!</h1>

          <pre>
            {JSON.stringify(this.props.health, null, 2)}            
          </pre>
        </Card>
      </div>  
    );
  }
}

const mapStateToProps = (state) => {
  return {
    health: state.health
  }
}

export default connect(mapStateToProps, { getApiHealth })(App)
// export default withRouter(connected)