import React from 'react';
import { TouchableHighlight, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/themeContext';

const CustomButton = ({ onPress, title, buttonStyle, textStyle, underlayColor, icon }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableHighlight
      underlayColor={underlayColor || colors.primaryDark}
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

const createStyles = (colors) =>
  StyleSheet.create({
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
      color: 'white',
      fontSize: 16,
    },
  });

export default CustomButton;
