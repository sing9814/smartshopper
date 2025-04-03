import React, { useState, useEffect } from 'react';
import { Animated, TextInput, View, StyleSheet, ScrollView } from 'react-native';
import colors from '../utils/colors';

const CustomInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  type = 'default',
  multiline,
  component,
  editable = true,
  budget,
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

  const length = () => {
    if (budget) {
      return 4;
    }
    if (type === 'numeric') {
      return 8;
    } else if (multiline) {
      return 200;
    }
    return 40;
  };

  return (
    <View>
      <View style={[styles.inputContainer, !editable && styles.disabled]}>
        <ScrollView>
          <TextInput
            style={[styles.input, !editable && styles.disabled]}
            value={value}
            onChangeText={onChangeText}
            placeholder={label}
            placeholderTextColor="gray"
            keyboardType={type}
            maxLength={length()}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            editable={editable}
          />
        </ScrollView>
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
    maxHeight: 200,
    lineHeight: 26,
    fontSize: 15,
  },
  disabled: {
    backgroundColor: '#dddddd',
    color: '#4d4d4d',
  },
});

export default CustomInput;
