import React, { useState, useEffect } from 'react';
import { Animated, TextInput, View, StyleSheet } from 'react-native';
import colors from '../utils/colors';

const CustomInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  type = 'default',
  multiline,
  component,
}) => {
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
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor="gray"
          keyboardType={type}
          maxLength={type === 'numeric' ? 8 : 40}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
        />
        {component}
      </View>

      {value && <Animated.Text style={labelStyle}>{label}</Animated.Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    color: colors.black,
    flex: 1,
  },
});

export default CustomInput;
