import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const fetchUserPurchases = async () => {
  const user = auth().currentUser;
  if (user) {
    try {
      const querySnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('Purchases')
        .get();

      const purchasesArray = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        key: doc.id,
      }));

      return purchasesArray;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
  } else {
    return [];
  }
};

export const fetchUserCollections = async () => {
  const user = auth().currentUser;
  if (!user) return [];

  try {
    const querySnapshot = await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('Collections')
      .get();

    const collections = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
};

export const fetchUserDetails = async () => {
  const user = auth().currentUser;
  if (user) {
    try {
      const userData = await firestore().collection('users').doc(user.uid).get();
      return userData.data();
    } catch (error) {
      console.error('Error fetching user data:', error);
      return [];
    }
  } else {
    return [];
  }
};

export const fetchAllUserData = async () => {
  const userData = await fetchUserDetails();
  const purchaseData = await fetchUserPurchases();
  const collectionData = await fetchUserCollections();

  if (hasLegacyTimestampData(userData, purchaseData, collectionData)) {
    try {
      await migrateCurrentUserTimestamps();

      return {
        userData: await fetchUserDetails(),
        purchaseData: await fetchUserPurchases(),
        collectionData: await fetchUserCollections(),
      };
    } catch (error) {
      console.error('Failed to migrate legacy timestamps:', error);
    }
  }

  return { userData, purchaseData, collectionData };
};

const isNativeTimestamp = (value) => value && typeof value.toDate === 'function';

const isLegacyTimestamp = (value) => {
  if (!value || isNativeTimestamp(value)) return false;
  if (typeof value === 'number') return true;

  const seconds = value.seconds ?? value._seconds;
  return typeof seconds === 'number';
};

const convertToFirestoreTimestamp = (value) => {
  if (!value || isNativeTimestamp(value)) return value;

  if (typeof value === 'number') {
    const milliseconds = value > 1000000000000 ? value : value * 1000;
    return firestore.Timestamp.fromDate(new Date(milliseconds));
  }

  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;

  if (typeof seconds !== 'number') return value;

  return firestore.Timestamp.fromDate(new Date(seconds * 1000 + Math.floor(nanoseconds / 1000000)));
};

const isLegacyDatePurchased = (value) => {
  return (
    isLegacyTimestamp(value) || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
  );
};

const convertDatePurchasedToFirestoreTimestamp = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return firestore.Timestamp.fromDate(new Date(year, month - 1, day));
  }

  return convertToFirestoreTimestamp(value);
};

const convertTimestampArray = (values = []) => values.map(convertToFirestoreTimestamp);

const hasLegacyTimestampArray = (values) => Array.isArray(values) && values.some(isLegacyTimestamp);

const getTimestampMilliseconds = (value) => {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'number') return value > 1000000000000 ? value : value * 1000;

  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;

  if (typeof seconds === 'number') return seconds * 1000 + Math.floor(nanoseconds / 1000000);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const sortTimestampArray = (values = []) => {
  return [...values].sort((a, b) => getTimestampMilliseconds(a) - getTimestampMilliseconds(b));
};

const hasUnsortedTimestampArray = (values) => {
  if (!Array.isArray(values)) return false;

  return values.some((value, index) => {
    if (index === 0) return false;
    return getTimestampMilliseconds(value) < getTimestampMilliseconds(values[index - 1]);
  });
};

const hasLegacyTimestampData = (userData, purchaseData = [], collectionData = []) => {
  if (isLegacyTimestamp(userData?.upgradedAt) || isLegacyTimestamp(userData?.registrationDate)) {
    return true;
  }

  return (
    purchaseData.some(
      (purchase) =>
        isLegacyTimestamp(purchase.dateCreated) ||
        isLegacyTimestamp(purchase.edited) ||
        isLegacyDatePurchased(purchase.datePurchased) ||
        hasLegacyTimestampArray(purchase.wears) ||
        hasUnsortedTimestampArray(purchase.wears)
    ) || collectionData.some((collection) => isLegacyTimestamp(collection.dateCreated))
  );
};

export const migrateCurrentUserTimestamps = async () => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not authenticated');

  const userRef = firestore().collection('users').doc(user.uid);
  const batch = firestore().batch();
  let updateCount = 0;

  const userSnapshot = await userRef.get();
  const userData = userSnapshot.data() || {};
  const userUpdates = {};

  if (isLegacyTimestamp(userData.upgradedAt)) {
    userUpdates.upgradedAt = convertToFirestoreTimestamp(userData.upgradedAt);
  }
  if (isLegacyTimestamp(userData.registrationDate)) {
    userUpdates.registrationDate = convertToFirestoreTimestamp(userData.registrationDate);
  }

  if (Object.keys(userUpdates).length > 0) {
    batch.update(userRef, userUpdates);
    updateCount += 1;
  }

  const purchasesSnapshot = await userRef.collection('Purchases').get();
  purchasesSnapshot.docs.forEach((doc) => {
    const purchase = doc.data();
    const updates = {};

    if (isLegacyTimestamp(purchase.dateCreated)) {
      updates.dateCreated = convertToFirestoreTimestamp(purchase.dateCreated);
    }
    if (isLegacyTimestamp(purchase.edited)) {
      updates.edited = convertToFirestoreTimestamp(purchase.edited);
    }
    if (isLegacyDatePurchased(purchase.datePurchased)) {
      updates.datePurchased = convertDatePurchasedToFirestoreTimestamp(purchase.datePurchased);
    }
    if (hasLegacyTimestampArray(purchase.wears) || hasUnsortedTimestampArray(purchase.wears)) {
      updates.wears = sortTimestampArray(convertTimestampArray(purchase.wears));
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      updateCount += 1;
    }
  });

  const collectionsSnapshot = await userRef.collection('Collections').get();
  collectionsSnapshot.docs.forEach((doc) => {
    const collection = doc.data();

    if (isLegacyTimestamp(collection.dateCreated)) {
      batch.update(doc.ref, {
        dateCreated: convertToFirestoreTimestamp(collection.dateCreated),
      });
      updateCount += 1;
    }
  });

  if (updateCount > 0) {
    await batch.commit();
  }

  return updateCount;
};

export const updatePurchaseWears = async (purchaseId, newWears) => {
  const user = auth().currentUser;
  if (user) {
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('Purchases')
        .doc(purchaseId)
        .update({
          wears: newWears,
        });
      console.log('Wears updated successfully');
    } catch (error) {
      console.error('Error updating wears:', error);
    }
  }
};

export const updateMultiplePurchaseWears = async (wearUpdates) => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not authenticated');
  if (wearUpdates.length === 0) return;

  const batch = firestore().batch();
  const purchasesRef = firestore().collection('users').doc(user.uid).collection('Purchases');

  wearUpdates.forEach(({ purchaseId, wears }) => {
    batch.update(purchasesRef.doc(purchaseId), { wears });
  });

  await batch.commit();
};

export const deleteDoc = async (subcollection, id) => {
  const user = auth().currentUser;
  if (user) {
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection(subcollection)
        .doc(id)
        .delete();

      console.log('Deleted item successfully');
    } catch (error) {
      console.error('Error deleting item: ', error);
    }
  }
};

export const userExists = async (id) => {
  try {
    const userDoc = await firestore().collection('users').doc(id).get();
    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    return userData?.onboarded !== false;
  } catch (error) {
    console.error('Error checking user existence: ', error);
    return false;
  }
};

export const getUserOnboardingStatus = async (id) => {
  try {
    const userDoc = await firestore().collection('users').doc(id).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    return userData?.onboarded !== false;
  } catch (error) {
    console.error('Error checking onboarding status: ', error);
    return false;
  }
};

export const fetchMergedCategories = async (defaultCategories) => {
  const userID = auth().currentUser.uid;

  const customSnapshot = await firestore()
    .collection('users')
    .doc(userID)
    .collection('customCategories')
    .get();

  const customData = customSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Convert default subcategories into { name, custom: false }
  const merged = defaultCategories.map((cat) => ({
    name: cat.name,
    subCategories: cat.subCategories.map((name) => ({
      id: `${cat.name.toLowerCase()}_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name,
      custom: false,
    })),
  }));

  for (const { id, category, subCategory } of customData) {
    if (subCategory) {
      const parent = merged.find((c) => c.name === category);

      if (parent && !parent.subCategories.some((sub) => sub.id === id)) {
        parent.subCategories.push({
          id,
          name: subCategory,
          custom: true,
        });
      }
    } else {
      const exists = merged.some((c) => c.name === category);

      if (!exists) {
        merged.push({
          id,
          name: category,
          custom: true,
          subCategories: [],
        });
      }
    }
  }

  const flattenedCustom = customData.map(({ id, category, subCategory }) => ({
    id,
    category,
    name: subCategory || category,
  }));

  return { merged, customCategories: flattenedCustom };
};

export const saveCustomCategory = async ({ id, category, subCategory = null }) => {
  try {
    const userID = auth().currentUser.uid;

    await firestore()
      .collection('users')
      .doc(userID)
      .collection('customCategories')
      .doc(id)
      .set({ category, subCategory });

    return true;
  } catch (error) {
    console.error('Failed to save custom subcategory:', error);
    return false;
  }
};

export const updateCustomCategory = async ({ id, category, subCategory = null }) => {
  const userID = auth().currentUser.uid;
  try {
    await firestore()
      .collection('users')
      .doc(userID)
      .collection('customCategories')
      .doc(id)
      .update({
        category,
        subCategory,
      });

    return true;
  } catch (error) {
    console.error('Failed to update custom subcategory:', error);
    return false;
  }
};

export const addItemsToCollections = async (itemIDs, collectionIDs) => {
  const user = auth().currentUser.uid;
  if (!user) throw new Error('User not authenticated');

  const promises = collectionIDs.map(async (collectionID) => {
    const ref = firestore()
      .collection('users')
      .doc(user)
      .collection('Collections')
      .doc(collectionID);

    await ref.update({
      items: firestore.FieldValue.arrayUnion(...itemIDs),
    });
  });

  await Promise.all(promises);
};

export const removeItemsFromCollection = async (itemIDs, collectionID) => {
  const user = auth().currentUser.uid;
  if (!user) throw new Error('User not authenticated');

  const ref = firestore().collection('users').doc(user).collection('Collections').doc(collectionID);

  await ref.update({
    items: firestore.FieldValue.arrayRemove(...itemIDs),
  });
};
