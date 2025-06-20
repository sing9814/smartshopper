import {
  SET_USER,
  SET_USER_ONBOARDED,
  SET_CATEGORIES,
  SET_CUSTOM_CATEGORIES,
} from '../actions/userActions';

const initialState = {
  user: null,
  userOnboarded: false,
  categories: [],
  customCategories: [],
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
    case SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
      };
    case SET_CUSTOM_CATEGORIES:
      return {
        ...state,
        customCategories: action.payload,
      };
    default:
      return state;
  }
};

export default userReducer;
