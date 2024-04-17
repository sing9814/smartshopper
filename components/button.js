import React from 'react';
import { TouchableHighlight, Text, StyleSheet } from 'react-native';
import colors from '../utils/colors';

const CustomButton = ({ onPress, title, buttonStyle }) => {
  return (
    <TouchableHighlight
      underlayColor={colors.primaryDark}
      onPress={onPress}
      style={[styles.button, buttonStyle]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 16,
  },
});

export default CustomButton;
