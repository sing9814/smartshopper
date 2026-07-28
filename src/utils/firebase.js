import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const isLocalGuest = () => !auth().currentUser;

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

  return { userData, purchaseData, collectionData };
};

export const updatePurchaseWears = async (purchaseId, newWears) => {
  if (isLocalGuest()) return;
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
  if (isLocalGuest()) return;
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

export const updateCollectionWearHistory = async ({
  collectionId,
  wearHistory,
  purchaseWearUpdates,
}) => {
  if (isLocalGuest()) return;
  const user = auth().currentUser;
  if (!user) throw new Error('User not authenticated');

  const batch = firestore().batch();
  const userRef = firestore().collection('users').doc(user.uid);
  const purchasesRef = userRef.collection('Purchases');

  purchaseWearUpdates.forEach(({ purchaseId, wears }) => {
    batch.update(purchasesRef.doc(purchaseId), { wears });
  });
  batch.update(userRef.collection('Collections').doc(collectionId), { wearHistory });

  await batch.commit();
};

export const deleteDoc = async (subcollection, id) => {
  if (isLocalGuest()) return;
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
  if (isLocalGuest()) return true;
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
  if (isLocalGuest()) return true;
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
  if (isLocalGuest()) return;
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
  if (isLocalGuest()) return;
  const user = auth().currentUser.uid;
  if (!user) throw new Error('User not authenticated');

  const ref = firestore().collection('users').doc(user).collection('Collections').doc(collectionID);

  await ref.update({
    items: firestore.FieldValue.arrayRemove(...itemIDs),
  });
};
