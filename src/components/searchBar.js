import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/themeContext';

const SearchBar = ({ value, onChangeText, placeholder = 'Search', style }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={19} color={colors.gray} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.lightGrey,
    },
    input: {
      flex: 1,
      color: colors.black,
      fontSize: 15,
      paddingVertical: 0,
    },
    clearButton: {
      width: 20,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default SearchBar;
