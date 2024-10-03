import { SET_USER, SET_USER_ONBOARDED } from '../actions/userActions';

const initialState = {
  user: null,
  userOnboarded: false,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        user: action.payload,
      };
    case SET_USER_ONBOARDED:
      return {
        ...state,
        userOnboarded: action.payload,
      };
    default:
      return state;
  }
};

export default userReducer;
