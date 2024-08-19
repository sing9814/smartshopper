import { combineReducers } from 'redux';
import purchaseReducer from './purchaseReducer';
import userReducer from './userReducer';

export default combineReducers({
  purchase: purchaseReducer,
  user: userReducer,
});
