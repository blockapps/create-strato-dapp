import {
  GET_API_HEALTH_RESPONSE
} from '../actions/health.actions'
const initialState = {}

const reducer = (state = initialState, action) => {
  switch(action.type) {
    case GET_API_HEALTH_RESPONSE:
      return action.response
    default:
      return state
  }
}

export default reducer