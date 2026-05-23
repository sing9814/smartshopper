import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/themeContext';
import CustomButton from './button';
import SearchBar from './searchBar';
import BottomSheet from './bottomSheet';

const CategoryPickerSheet = ({
  visible,
  onClose,
  items,
  onSelect,
  setSelectedItem,
  onOpenCustomSheet,
}) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const tabBarHeight = useBottomTabBarHeight();

  const [search, setSearch] = useState('');

  const getFilteredItems = () => {
    const normalizedSearch = search.toLowerCase();
    const topLevelItems = items
      .map((category) => ({
        category: category.name || category.category,
        subCategory: null,
        custom: category.custom || false,
      }))
      .filter((item) => item.category);
    const customItems = items.flatMap((category) =>
      (category.subCategories || [])
        .filter((subCategory) => subCategory.custom)
        .map((subCategory) => ({
          category: subCategory.name,
          subCategory: null,
          custom: true,
        }))
        .filter((item) => item.category)
    );

    return [...topLevelItems, ...customItems].filter((item) =>
      item.category.toLowerCase().includes(normalizedSearch)
    );
  };

  const filteredItems = getFilteredItems();

  const handleSelect = (item) => {
    onSelect(item);
    setSelectedItem(item);
    onClose();
    setSearch('');
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      return (
        <TouchableOpacity
          key={`${item.category}-${index}`}
          style={[styles.item, index === filteredItems.length - 1 && styles.lastItem]}
          onPress={() => handleSelect(item)}
        >
          <View style={styles.customLabelContainer}>
            <Text style={styles.itemText}>{item.category}</Text>
            {item.custom && <Text style={styles.customTag}>(custom)</Text>}
          </View>
        </TouchableOpacity>
      );
    },
    [filteredItems]
  );

  return (
    <BottomSheet title="Choose category" visible={visible} onClose={onClose} height="72%">
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search categories"
        style={styles.searchBar}
      />
      {filteredItems.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsTitle}>No result for "{search}"</Text>
          <Text style={styles.noResultsSubtitle}>
            Hmm, we can't find the category you're looking for. Would you like to add it?
          </Text>
          <CustomButton
            buttonStyle={styles.button}
            onPress={() => {
              onClose();
              onOpenCustomSheet?.(search);
            }}
            title="Create custom category"
          />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.category}-${index}`}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </BottomSheet>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    searchBar: {
      width: '100%',
      marginBottom: 10,
    },
    list: {
      flex: 1,
      width: '100%',
    },
    noResults: {
      alignItems: 'center',
      width: '100%',
      paddingVertical: 18,
      paddingHorizontal: 8,
    },
    noResultsTitle: {
      fontSize: 18,
      color: colors.black,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
    },
    noResultsSubtitle: {
      color: colors.gray,
      marginBottom: 14,
      textAlign: 'center',
      lineHeight: 22,
    },
    item: {
      minHeight: 52,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightestGrey,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    customLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    itemText: {
      fontSize: 15,
      color: colors.black,
    },
    customTag: {
      color: colors.gray,
      fontSize: 13,
    },
  });

export default CategoryPickerSheet;
