export const SET_PURCHASES = 'SET_PURCHASES';
export const UPDATE_PURCHASE = 'UPDATE_PURCHASE';

export const setPurchases = (purchases) => {
  return {
    type: SET_PURCHASES,
    payload: purchases,
  };
};
export const updatePurchase = (updatedPurchase) => {
  return {
    type: UPDATE_PURCHASE,
    payload: updatedPurchase,
  };
};
