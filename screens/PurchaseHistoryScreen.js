import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const PurchaseHistoryScreen = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const subscriber = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('Purchases')
        .onSnapshot((querySnapshot) => {
          const purchasesArray = [];

          querySnapshot.forEach((documentSnapshot) => {
            purchasesArray.push({
              ...documentSnapshot.data(),
              key: documentSnapshot.id,
            });
          });

          setPurchases(purchasesArray);
          setLoading(false);
        });

      return () => subscriber();
    }
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <FlatList
        data={purchases}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.blackText}>Item: {item.name}</Text>
            <Text style={styles.blackText}>Price: ${item.regularPrice}</Text>
            <Text style={styles.blackText}>Price: ${item.salePrices}</Text>
            <Text style={styles.blackText}>Price: ${item.paidPrice}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  blackText: {
    color: 'black',
  },
});

export default PurchaseHistoryScreen;
