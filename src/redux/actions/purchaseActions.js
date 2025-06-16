export const SET_PURCHASES = 'SET_PURCHASES';
export const CURRENT_PURCHASE = 'CURRENT_PURCHASE';
export const SET_COLLECTIONS = 'SET_COLLECTIONS';

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
export const setCollections = (collections) => {
  return {
    type: SET_COLLECTIONS,
    payload: collections,
  };
};
