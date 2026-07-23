import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_DATA_KEY = '@smartshopper/guest-data';

const EMPTY_GUEST_DATA = {
  active: false,
  pendingAuthUid: null,
  userData: null,
  purchases: [],
  collections: [],
  customCategories: [],
};

export const getGuestData = async () => {
  try {
    const value = await AsyncStorage.getItem(GUEST_DATA_KEY);
    return value ? { ...EMPTY_GUEST_DATA, ...JSON.parse(value) } : { ...EMPTY_GUEST_DATA };
  } catch (error) {
    console.error('Failed to load local guest data:', error);
    return { ...EMPTY_GUEST_DATA };
  }
};

export const saveGuestData = async (data) => {
  try {
    await AsyncStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save local guest data:', error);
  }
};

export const createLocalGuest = async () => {
  const existingData = await getGuestData();

  await saveGuestData({
    ...existingData,
    active: true,
    pendingAuthUid: null,
    userData: existingData.userData || {
      email: null,
      isGuest: true,
      onboarded: false,
      registrationDate: new Date().toISOString(),
    },
  });
};

export const setGuestActive = async (active) => {
  const data = await getGuestData();
  await saveGuestData({ ...data, active });
};

export const setGuestPendingAuthUid = async (pendingAuthUid) => {
  const data = await getGuestData();
  await saveGuestData({ ...data, pendingAuthUid });
};

export const setLocalGuestOnboarded = async (onboarded) => {
  const data = await getGuestData();
  await saveGuestData({
    ...data,
    userData: {
      ...(data.userData || {}),
      email: null,
      isGuest: true,
      onboarded,
      registrationDate: data.userData?.registrationDate || new Date().toISOString(),
    },
  });
};

export const clearGuestData = () => AsyncStorage.removeItem(GUEST_DATA_KEY);
