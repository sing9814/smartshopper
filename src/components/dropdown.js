import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Animated,
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Pressable,
} from 'react-native';
import colors from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomButton from './button';

const CustomDropdown = ({ items, onSelect, selectedItem, setSelectedItem }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const getFilteredItems = () => {
    return items
      .filter((category) => {
        const nameMatches = category.name.toLowerCase().includes(search.toLowerCase());
        const subCategoriesMatch = category.subCategories.some((subCategory) =>
          subCategory.toLowerCase().includes(search.toLowerCase())
        );
        return nameMatches || subCategoriesMatch;
      })
      .flatMap((category) => {
        const categoryItems = [{ category: category.name, subCategory: null }];
        if (expandedCategories.has(category.name) || search) {
          category.subCategories
            .filter((subCategory) => subCategory.toLowerCase().includes(search.toLowerCase()))
            .forEach((subCategory) =>
              categoryItems.push({ category: category.name, subCategory: subCategory })
            );
        }
        return categoryItems;
      });
  };

  const filteredItems = getFilteredItems();

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: selectedItem ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [selectedItem, animatedValue]);

  const labelStyle = {
    position: 'absolute',
    left: 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: 13,
    color: colors.primary,
  };

  const handleSelect = (item) => {
    onSelect(item);
    setSelectedItem(item);
    setVisible(false);
  };

  const handleToggleCategory = (category) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      const isCategory = !item.subCategory;
      const displayText = item.subCategory || item.category;
      const isExpanded = expandedCategories.has(item.category);

      return (
        <TouchableOpacity
          key={`${item.category}-${item.subCategory}-${index}`}
          style={[
            index !== filteredItems.length - 1 ? styles.item : styles.lastItem,
            item.subCategory && styles.subCategoryItem,
          ]}
          onPress={() => (isCategory ? handleToggleCategory(item.category) : handleSelect(item))}
        >
          <Text style={styles.text}>{displayText}</Text>
          {isCategory && !search && (
            <Ionicons
              style={isExpanded && styles.arrow}
              name={'caret-down-outline'}
              size={16}
              color={colors.black}
            />
          )}
        </TouchableOpacity>
      );
    },
    [expandedCategories, filteredItems, search]
  );

  return (
    <View>
      <Pressable style={styles.container} onPress={() => setVisible(true)}>
        <Text style={[styles.text, { color: selectedItem ? 'black' : 'gray' }]}>
          {selectedItem
            ? `${selectedItem.category}${
                selectedItem.subCategory ? ` - ${selectedItem.subCategory}` : ''
              }`
            : 'Category'}
        </Text>
        <Ionicons
          style={visible && styles.arrow}
          name={'caret-down-outline'}
          size={16}
          color={colors.black}
        />
      </Pressable>
      <Modal visible={visible} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Search"
                placeholderTextColor={'gray'}
                value={search}
                onChangeText={setSearch}
              />
              {/* <View style={styles.noResults}>
                <Text style={styles.noResultsTitle}>No result for {search}</Text>
                <Text style={styles.noResultsSubtitle}>
                  Hmm, we can't find the category you're looking for. Would you like to add it?
                </Text>
                <CustomButton
                  buttonStyle={styles.button}
                  onPress={() => {}}
                  title="Create custom category"
                />
              </View> */}
              <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.category}-${item.subCategory}-${index}`}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {selectedItem && <Animated.Text style={labelStyle}>Category</Animated.Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  arrow: {
    transform: [{ rotate: '180deg' }],
  },
  text: {
    color: 'gray',
  },
  container: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 150,
    alignItems: 'center',
  },
  modalContent: {
    width: '93%',
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    elevation: 2,
  },
  noResults: {
    alignItems: 'center',
    marginVertical: 8,
  },
  noResultsTitle: {
    fontSize: 18,
    color: colors.black,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    color: 'gray',
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    color: 'black',
  },
  lastItem: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subCategoryItem: {
    paddingLeft: 20,
  },
});

export default CustomDropdown;
