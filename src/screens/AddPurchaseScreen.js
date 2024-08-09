import React from 'react';
import { View } from 'react-native';
import PurchaseForm from '../components/purchaseForm';

const AddPurchaseScreen = ({ route }) => {
  const { name = '' } = route.params || {};

  return (
    <View style={{ flex: 1 }}>
      <PurchaseForm name={name}></PurchaseForm>
    </View>
  );
};

export default AddPurchaseScreen;
