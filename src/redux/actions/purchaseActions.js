export const SET_PURCHASES = 'SET_PURCHASES';
export const CURRENT_PURCHASE = 'CURRENT_PURCHASE';

export const setPurchases = (purchases) => {
  return {
    type: SET_PURCHASES,
    payload: purchases,
  };
};
export const setCurrentPurchase = (purchase) => {
  return {
    type: CURRENT_PURCHASE,
    payload: purchase,
  };
};
