import React from 'react';
import { TouchableHighlight, Text, StyleSheet, View } from 'react-native';
import colors from '../utils/colors';

const CustomButton = ({
  onPress,
  title,
  buttonStyle,
  textStyle,
  underlayColor = colors.primaryDark,
  icon,
}) => {
  return (
    <TouchableHighlight
      underlayColor={underlayColor}
      onPress={onPress}
      style={[styles.button, buttonStyle]}
    >
      <View style={styles.innerContainer}>
        {icon}
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </View>
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
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: colors.white,
    fontSize: 16,
  },
});

export default CustomButton;
