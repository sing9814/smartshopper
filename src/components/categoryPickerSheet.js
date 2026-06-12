import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  const [expandedCategories, setExpandedCategories] = useState({});

  const getCategoryName = (category) => category.name || category.category || '';

  const getSubcategoryName = (subCategory) =>
    typeof subCategory === 'string' ? subCategory : subCategory?.name || '';

  const getSubcategoryItem = (categoryName, subCategory) => ({
    category: categoryName,
    subCategory:
      typeof subCategory === 'string'
        ? {
            id: `${categoryName}-${subCategory}`,
            name: subCategory,
            custom: false,
          }
        : subCategory,
    custom: subCategory?.custom || false,
  });

  const getVisibleItems = () => {
    const normalizedSearch = search.toLowerCase();
    const isSearching = normalizedSearch.length > 0;

    return items.flatMap((category) => {
      const categoryName = getCategoryName(category);
      const subCategories = category.subCategories || [];

      if (!categoryName) return [];

      const categoryRow = {
        category: categoryName,
        subCategory: null,
        custom: category.custom || false,
        type: 'category',
        isExpanded: expandedCategories[categoryName],
        hasSubcategories: subCategories.length > 0,
      };

      if (!isSearching) {
        const childRows = expandedCategories[categoryName]
          ? subCategories.map((subCategory) => ({
              ...getSubcategoryItem(categoryName, subCategory),
              type: 'subcategory',
            }))
          : [];

        return [categoryRow, ...childRows];
      }

      const categoryMatches = categoryName.toLowerCase().includes(normalizedSearch);
      const matchingSubcategories = subCategories
        .filter((subCategory) =>
          getSubcategoryName(subCategory).toLowerCase().includes(normalizedSearch)
        )
        .map((subCategory) => ({
          ...getSubcategoryItem(categoryName, subCategory),
          type: 'subcategory',
        }));

      return categoryMatches ? [categoryRow, ...matchingSubcategories] : matchingSubcategories;
    });
  };

  const visibleItems = getVisibleItems();

  const handleSelect = (item) => {
    onSelect(item);
    setSelectedItem?.(item);
    onClose();
    setSearch('');
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const renderItem = ({ item, index }) => {
    const isCategory = item.type === 'category';
    const isLast = index === visibleItems.length - 1;

    return (
      <TouchableOpacity
        key={`${item.category}-${index}`}
        style={[
          styles.item,
          item.type === 'subcategory' && styles.subcategoryItem,
          isLast && styles.lastItem,
        ]}
        onPress={() => {
          if (isCategory && item.hasSubcategories) {
            toggleCategory(item.category);
          } else {
            handleSelect(item);
          }
        }}
      >
        <View style={styles.customLabelContainer}>
          <Text style={[styles.itemText, item.type === 'subcategory' && styles.subcategoryText]}>
            {item.subCategory?.name || item.category}
          </Text>
          {item.custom && <Text style={styles.customTag}>(custom)</Text>}
        </View>
        {isCategory && item.hasSubcategories && (
          <Ionicons
            name={item.isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.gray}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet title="Choose category" visible={visible} onClose={onClose} height="72%">
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search categories"
        style={styles.searchBar}
      />
      {visibleItems.length === 0 ? (
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
            title="Create subcategory"
          />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
          data={visibleItems}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            `${item.type}-${item.category}-${item.subCategory?.id || index}`
          }
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
    subcategoryItem: {
      paddingLeft: 20,
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
    subcategoryText: {
      color: colors.gray,
    },
    customTag: {
      color: colors.gray,
      fontSize: 13,
    },
  });

export default CategoryPickerSheet;
