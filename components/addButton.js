import React from 'react';
import { TouchableHighlight, Text, StyleSheet } from 'react-native';
import colors from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddButton = ({ onPress, size }) => {
  return (
    <TouchableHighlight underlayColor={colors.primaryDark} onPress={onPress} style={styles.button}>
      <Ionicons name="add" size={size || 30} color={colors.white} />
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    // width: '100%',
    height: 50,
    width: 50,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 16,
  },
});

export default AddButton;
