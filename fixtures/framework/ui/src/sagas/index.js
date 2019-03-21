
import {
  fork,
  all
} from 'redux-saga/effects';
import watchHealthActions from './health.saga';

const rootSaga = function* () {
  yield all([
    fork(watchHealthActions),
  ])
}

export default rootSaga