export const SET_USER = 'SET_USER';
export const SET_USER_ONBOARDED = 'USER_ONBOARDED';

export const setUser = (user) => {
  return {
    type: SET_USER,
    payload: user,
  };
};
export const setUserOnboarded = (user) => {
  return {
    type: SET_USER_ONBOARDED,
    payload: user,
  };
};
