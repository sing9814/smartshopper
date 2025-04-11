import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';

const ConfirmationPopup = ({ message, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="checkmark-circle-outline" size={20} color="white" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.confirmationModal,
    padding: 15,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 15,
    gap: 5,
    elevation: 1,
    borderRadius: 10,
    marginHorizontal: 12,
    flexDirection: 'row',
    marginTop: 10,
    zIndex: 1000,
  },
  message: {
    color: 'white',
    marginLeft: 3,
    marginRight: 25,
    fontWeight: '400',
    fontSize: 15,
  },
});

export default ConfirmationPopup;
