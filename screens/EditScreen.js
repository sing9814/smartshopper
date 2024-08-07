import React from 'react';
import { View, StyleSheet } from 'react-native';
import PurchaseForm from '../components/purchaseForm';

const EditScreen = ({ route, navigation }) => {
  const { purchase } = route.params || {};

  return (
    <View style={styles.container}>
      <PurchaseForm purchase={purchase} navigation={navigation} edit />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EditScreen;
