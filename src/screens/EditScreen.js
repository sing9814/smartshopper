import React from 'react';
import { View, StyleSheet } from 'react-native';
import PurchaseForm from '../components/purchaseForm';
import { useTheme } from '../theme/themeContext';
import { StatusBar } from 'react-native';

const EditScreen = ({ route, navigation }) => {
  const { purchase } = route.params || {};
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" translucent={false} />
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
