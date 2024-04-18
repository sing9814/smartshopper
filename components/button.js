import React from 'react';
import { TouchableHighlight, Text, StyleSheet, View } from 'react-native';
import colors from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CustomButton = ({ onPress, title, buttonStyle, icon = null }) => {
  return (
    <TouchableHighlight
      underlayColor={colors.primaryDark}
      onPress={onPress}
      style={[styles.button, buttonStyle]}
    >
      <View style={styles.innerContainer}>
        {icon ? <Ionicons name={icon} size={20} color={colors.white} /> : null}
        <Text style={styles.text}>{title}</Text>
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
