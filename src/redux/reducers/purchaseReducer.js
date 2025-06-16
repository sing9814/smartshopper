import { CURRENT_PURCHASE, SET_PURCHASES, SET_COLLECTIONS } from '../actions/purchaseActions';

const initialState = {
  purchases: [],
  currentPurchase: {},
  collections: [],
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
    case SET_COLLECTIONS:
      return {
        ...state,
        collections: action.payload,
      };
    default:
      return state;
  }
};

export default purchaseReducer;
