import React from 'react';
import { TextInput, View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/themeContext';

const CustomInput = ({
  autoCapitalize = true,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  type = 'default',
  multiline,
  component,
  prefix,
  editable = true,
  budget,
}) => {
  const colors = useTheme();
  const styles = createStyles(colors);

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
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          !editable && styles.disabled,
          multiline && styles.multilineContainer,
        ]}
      >
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && styles.disabledText,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={colors.placeholder}
          keyboardType={type}
          maxLength={length()}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {component}
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
    },
    label: {
      fontSize: 13,
      color: colors.gray,
      fontWeight: '600',
      marginBottom: 6,
      marginLeft: 2,
    },
    inputContainer: {
      backgroundColor: colors.white,
      borderRadius: 10,
      minHeight: 52,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.lightGrey,
    },
    multilineContainer: {
      minHeight: 96,
      alignItems: 'flex-start',
      paddingTop: 10,
      paddingBottom: 10,
    },
    input: {
      flex: 1,
      color: colors.black,
      lineHeight: 22,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    multilineInput: {
      minHeight: 74,
    },
    prefix: {
      color: colors.gray,
      fontSize: 15,
      lineHeight: 22,
      width: 20,
      marginRight: 10,
      marginLeft: 5,
      textAlign: 'center',
    },
    disabled: {
      backgroundColor: colors.lightestGrey,
      opacity: 0.8,
    },
    disabledText: {
      color: colors.gray,
    },
  });

export default CustomInput;
