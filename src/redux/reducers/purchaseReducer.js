import { SET_PURCHASES, UPDATE_PURCHASE } from '../actions/purchaseActions';

const initialState = {
  purchases: [],
};

const purchaseReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_PURCHASES:
      return {
        ...state,
        purchases: action.payload,
      };
    case UPDATE_PURCHASE:
      return {
        ...state,
        purchases: state.purchases.map((purchase) =>
          purchase.key === action.payload.key ? action.payload : purchase
        ),
      };
    default:
      return state;
  }
};

export default purchaseReducer;
