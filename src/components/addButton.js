import React from 'react';
import { TouchableHighlight, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/themeContext';

const AddButton = ({ onPress, scale = 1, disabled = false, style }) => {
  const colors = useTheme();

  return (
    <TouchableHighlight
      underlayColor={colors.primaryDark}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.lightGrey : colors.primary,
          height: scale * 32,
          width: scale * 32,
        },
        style,
      ]}
      disabled={disabled}
    >
      <Ionicons name="add" size={scale * 20} color={colors.white} />
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddButton;
