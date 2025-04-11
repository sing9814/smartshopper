import React from 'react';
import { TouchableHighlight, StyleSheet } from 'react-native';
import colors from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddButton = ({ onPress, size, disabled = false }) => {
  return (
    <TouchableHighlight
      underlayColor={colors.primaryDark}
      onPress={onPress}
      style={[styles.button, { backgroundColor: disabled ? colors.lightGrey : colors.primary }]}
      disabled={disabled}
    >
      <Ionicons name="add" size={size || 30} color={colors.white} />
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 40,
    width: 40,
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
