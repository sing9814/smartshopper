import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const fetchPurchases = async () => {
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

export const fetchAccountDetails = async () => {
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

export const fetchUserDataAndPurchases = async () => {
  const userData = await fetchAccountDetails();
  const purchaseData = await fetchPurchases();

  return { userData, purchaseData };
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

export const deletePurchase = async (purchaseId) => {
  const user = auth().currentUser;
  if (user) {
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('Purchases')
        .doc(purchaseId)
        .delete();

      console.log('Purchase deleted successfully');
    } catch (error) {
      console.error('Error deleting purchase:', error);
    }
  }
};

export const userExists = async (id) => {
  try {
    const userDoc = await firestore().collection('users').doc(id).get();
    return userDoc.exists;
  } catch (error) {
    console.error('Error checking user existence: ', error);
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
    const catMatch = merged.find((c) => c.name === category);

    if (catMatch) {
      const exists = catMatch.subCategories.some((s) => s.name === subCategory);
      if (!exists) {
        catMatch.subCategories.push({ id, name: subCategory, custom: true });
      }
    } else {
      merged.push({
        name: category,
        subCategories: [{ id, name: subCategory, custom: true }],
      });
    }
  }

  const flattenedCustom = customData.map(({ id, category, subCategory }) => ({
    id,
    category,
    name: subCategory,
  }));

  return { merged, customCategories: flattenedCustom };
};

export const saveCustomCategory = async ({ id, category, subCategory }) => {
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
    console.error('Failed to save custom category:', error);
    return false;
  }
};

export const updateCustomCategory = async ({ id, category, subCategory }) => {
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
    console.error('Failed to update custom category:', error);
    return false;
  }
};
