import React from 'react';
import { View } from 'react-native';
import PurchaseForm from '../components/purchaseForm';
import { useStatusBar } from '../hooks/useStatusBar';
import { useTheme } from '../theme/themeContext';

const AddPurchaseScreen = ({ route }) => {
  const { name = '', date = '', purchase } = route.params || {};
  const colors = useTheme();

  useStatusBar(colors.primary);

  return (
    <View style={{ flex: 1 }}>
      <PurchaseForm name={name} date={date} purchase={purchase}></PurchaseForm>
    </View>
  );
};

export default AddPurchaseScreen;
