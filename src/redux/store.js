import { createStore } from 'redux';
import auth from '@react-native-firebase/auth';
import rootReducer from './reducers';
import { saveGuestData } from '../utils/guestStorage';

const store = createStore(rootReducer);

let guestSaveTimeout;

store.subscribe(() => {
  const state = store.getState();
  if (auth().currentUser || !state.user.user?.isGuest) {
    clearTimeout(guestSaveTimeout);
    return;
  }

  clearTimeout(guestSaveTimeout);
  guestSaveTimeout = setTimeout(() => {
    const nextState = store.getState();
    saveGuestData({
      active: true,
      userData: {
        ...(nextState.user.user || {}),
        email: null,
        isGuest: true,
        onboarded: nextState.user.userOnboarded,
      },
      purchases: nextState.purchase.purchases,
      collections: nextState.purchase.collections,
      customCategories: nextState.user.customCategories,
    });
  }, 150);
});

export default store;
