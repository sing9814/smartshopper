import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const getFilteredItems = () => {
    return items
      .filter((category) => {
        const nameMatches = category.name.toLowerCase().includes(search.toLowerCase());
        const subMatches = category.subCategories.some((sub) =>
          sub.name.toLowerCase().includes(search.toLowerCase())
        );
        return nameMatches || subMatches;
      })
      .flatMap((category) => {
        const categoryItems = [{ category: category.name, subCategory: null }];
        if (expandedCategories.has(category.name) || search) {
          category.subCategories
            .filter((sub) => sub.name.toLowerCase().includes(search.toLowerCase()))
            .forEach((subCategory) => categoryItems.push({ category: category.name, subCategory }));
        }
        return categoryItems;
      });
  };

  const filteredItems = getFilteredItems();

  const handleSelect = (item) => {
    onSelect(item);
    setSelectedItem(item);
    onClose();
    setSearch('');
  };

  const handleToggleCategory = (category) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      newSet.has(category) ? newSet.delete(category) : newSet.add(category);
      return newSet;
    });
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      const isCategory = !item.subCategory;
      const displayText = item.subCategory?.name || item.category;
      const isExpanded = expandedCategories.has(item.category);

      return (
        <TouchableOpacity
          key={`${item.category}-${item.subCategory?.name || 'header'}-${index}`}
          style={[
            styles.item,
            isCategory && styles.categoryItem,
            item.subCategory && styles.subCategoryItem,
            index === filteredItems.length - 1 && styles.lastItem,
          ]}
          onPress={() => (isCategory ? handleToggleCategory(item.category) : handleSelect(item))}
        >
          <View style={styles.customLabelContainer}>
            <Text style={[styles.itemText, isCategory && styles.categoryText]}>{displayText}</Text>
            {item.subCategory?.custom && <Text style={styles.customTag}>(custom)</Text>}
          </View>

          {isCategory && !search && (
            <Ionicons
              name="chevron-down"
              size={16}
              style={isExpanded ? styles.arrowUp : styles.arrowDown}
              color={colors.black}
            />
          )}
        </TouchableOpacity>
      );
    },
    [expandedCategories, filteredItems, search]
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
          keyExtractor={(item, index) => `${item.category}-${item.subCategory?.name}-${index}`}
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
    categoryItem: {
      backgroundColor: colors.white,
    },
    subCategoryItem: {
      paddingLeft: 26,
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
    categoryText: {
      fontWeight: '600',
    },
    arrowDown: {
      transform: [{ rotate: '0deg' }],
    },
    arrowUp: {
      transform: [{ rotate: '180deg' }],
    },
    customTag: {
      color: colors.gray,
      fontSize: 13,
    },
  });

export default CategoryPickerSheet;
