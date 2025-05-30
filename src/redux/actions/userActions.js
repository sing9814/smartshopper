export const SET_USER = 'SET_USER';
export const SET_USER_ONBOARDED = 'USER_ONBOARDED';
export const SET_CATEGORIES = 'CATEGORIES';
export const SET_CUSTOM_CATEGORIES = 'CUSTOM_CATEGORIES';

export const setUser = (user) => {
  return {
    type: SET_USER,
    payload: user,
  };
};
export const setUserOnboarded = (onboarded) => {
  return {
    type: SET_USER_ONBOARDED,
    payload: onboarded,
  };
};
export const setCategories = (categories) => {
  return {
    type: SET_CATEGORIES,
    payload: categories,
  };
};
export const setCustomCategories = (customCategories) => {
  return {
    type: SET_CUSTOM_CATEGORIES,
    payload: customCategories,
  };
};
