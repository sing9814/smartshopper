import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_DATA_KEY = '@smartshopper/guest-data';
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const EMPTY_GUEST_DATA = {
  active: false,
  pendingAuthUid: null,
  userData: null,
  purchases: [],
  collections: [],
  customCategories: [],
};

const toDateKey = (value) => {
  if (value == null || (typeof value === 'string' && DATE_KEY_PATTERN.test(value))) return value;

  const date =
    value instanceof Date ? value : typeof value.toDate === 'function' ? value.toDate() : null;
  if (!date || Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeGuestDates = (data) => ({
  ...data,
  userData: data.userData
    ? {
        ...data.userData,
        registrationDate: toDateKey(data.userData.registrationDate),
        upgradedAt: toDateKey(data.userData.upgradedAt),
      }
    : null,
  purchases: (data.purchases || []).map((purchase) => ({
    ...purchase,
    datePurchased: toDateKey(purchase.datePurchased),
    dateCreated: toDateKey(purchase.dateCreated),
    edited: toDateKey(purchase.edited),
    wears: (purchase.wears || []).map(toDateKey).filter(Boolean),
  })),
  collections: (data.collections || []).map((collection) => ({
    ...collection,
    dateCreated: toDateKey(collection.dateCreated),
    wearHistory: (collection.wearHistory || []).map((event) => ({
      ...event,
      date: toDateKey(event.date),
    })),
  })),
});

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
    await AsyncStorage.setItem(GUEST_DATA_KEY, JSON.stringify(normalizeGuestDates(data)));
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
      registrationDate: toDateKey(new Date()),
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
      registrationDate: data.userData?.registrationDate || toDateKey(new Date()),
    },
  });
};

export const clearGuestData = () => AsyncStorage.removeItem(GUEST_DATA_KEY);
