import React from 'react';
import { TouchableHighlight, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/themeContext';

const AddButton = ({ onPress, size, disabled = false, style }) => {
  const colors = useTheme();

  return (
    <TouchableHighlight
      underlayColor={colors.primaryDark}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: disabled ? colors.lightGrey : colors.primary },
        style,
      ]}
      disabled={disabled}
    >
      <Ionicons name="add" size={size || 30} color={colors.white} />
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 32,
    width: 32,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddButton;
