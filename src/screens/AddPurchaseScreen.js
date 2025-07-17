import React from 'react';
import { View } from 'react-native';
import PurchaseForm from '../components/purchaseForm';
import { useTheme } from '../theme/themeContext';

const AddPurchaseScreen = ({ props }) => {
  const route = props?.route ?? {};
  const { name = '', date = '', purchase } = route.params ?? {};
  const colors = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <PurchaseForm name={name} date={date} purchase={purchase}></PurchaseForm>
    </View>
  );
};

export default AddPurchaseScreen;
