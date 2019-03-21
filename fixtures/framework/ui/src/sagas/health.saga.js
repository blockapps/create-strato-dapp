import {
  call,
  takeLatest,
  put
} from 'redux-saga/effects'
import {
  GET_API_HEALTH,
  getApiHealthResponse
} from '../actions/health.actions'
import { apiUrl, HTTP_METHODS } from '../constants'

const healthUrl = `${apiUrl}/health`

function fetchHealth() {
  return fetch(healthUrl, {method: HTTP_METHODS.GET})
    .then((response) => response.json())
}

function* getHealth(action) {
  try {
    const response = yield call(fetchHealth)
    yield put(getApiHealthResponse(response))
  }
  catch(err) {
    yield put(getApiHealthResponse(err))
  }
}

export default function* watchHealth() {
  yield takeLatest(GET_API_HEALTH, getHealth)
}