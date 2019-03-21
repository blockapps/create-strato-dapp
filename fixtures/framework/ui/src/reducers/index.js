import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import healthReducer from './health.reducer';

export default (history) => combineReducers({
  router: connectRouter(history),
  health: healthReducer
});