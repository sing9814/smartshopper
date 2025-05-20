import React from 'react';
import { TextInput, View, StyleSheet, ScrollView, Text } from 'react-native';
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
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, !editable && styles.disabled]}>
        <ScrollView>
          <TextInput
            style={[styles.input, !editable && styles.disabled]}
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
          />
        </ScrollView>
        {component}
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    label: {
      fontSize: 13,
      color: colors.gray,
      marginBottom: 4,
      marginLeft: 2,
    },
    inputContainer: {
      backgroundColor: colors.white,
      borderRadius: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.lightGrey,
    },
    input: {
      color: colors.black,
      maxHeight: 200,
      lineHeight: 26,
      // fontSize: 15,
    },
    disabled: {
      backgroundColor: colors.lightgrey,
      color: colors.black,
    },
  });

export default CustomInput;
