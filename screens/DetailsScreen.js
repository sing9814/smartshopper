import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import colors from '../utils/colors';
import CustomButton from '../components/button';
import { deletePurchase } from '../utils/firebase';
import ConfirmationModal from '../components/confirmationModal';

const DetailsScreen = ({ route, navigation }) => {
  const { purchase } = route.params;

  const [errorMessage, setErrorMessage] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = () => {
    deletePurchase(purchase.key);
    navigation.goBack();
  };

  return (
    <View>
      {errorMessage && <Text>{errorMessage}</Text>}
      <Text style={styles.name}>{purchase.name}</Text>
      <CustomButton
        buttonStyle={styles.button}
        onPress={() => setModalVisible(true)}
        title="Delete"
      />
      <ConfirmationModal
        data={purchase.name}
        visible={modalVisible}
        onConfirm={handleDelete}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topbar: {
    width: '100%',
    backgroundColor: colors.primary,
    gap: 6,
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '500',
    color: 'black',
  },
  email: {
    color: colors.white,
  },
  container: {
    flex: 1,
  },
  calendar: {
    marginHorizontal: 12,
    borderRadius: 10,
  },
});

export default DetailsScreen;
