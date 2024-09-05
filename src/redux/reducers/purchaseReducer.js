import { CURRENT_PURCHASE, SET_PURCHASES } from '../actions/purchaseActions';

const initialState = {
  purchases: [],
  currentPurchase: {},
};

const purchaseReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_PURCHASES:
      return {
        ...state,
        purchases: action.payload,
      };
    case CURRENT_PURCHASE:
      return {
        ...state,
        currentPurchase: action.payload,
      };
    default:
      return state;
  }
};

export default purchaseReducer;
