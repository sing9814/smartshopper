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
