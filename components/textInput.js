import React, { useState, useEffect } from 'react';
import { Animated, TextInput, View, StyleSheet } from 'react-native';
import colors from '../utils/colors';

const CustomInput = ({ label, value, onChangeText, type = 'default' }) => {
  const animatedValue = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const labelStyle = {
    position: 'absolute',
    left: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -10],
    }),
    fontSize: 13,
    color: colors.primary,
  };

  return (
    <View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="gray"
        keyboardType={type}
        maxLength={type === 'numeric' ? 8 : 40}
      />
      {value && <Animated.Text style={labelStyle}>{label}</Animated.Text>}
    </View>
  );
};
{
  /* <TextInput
        editable
        multiline
        numberOfLines={4}
        maxLength={40}
        onChangeText={text => onChangeText(text)}
        value={value}
        style={{padding: 10}}
      /> */
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  input: {
    color: colors.black,
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
});

export default CustomInput;
