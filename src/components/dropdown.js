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
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import CustomButton from './button';

const CustomDropdown = ({ items, onSelect, selectedItem, setSelectedItem, onOpenCustomSheet }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: selectedItem ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [selectedItem]);

  const labelStyle = {
    position: 'absolute',
    left: 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: 13,
    color: colors.primary,
  };

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
    setVisible(false);
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
            item.subCategory && styles.subCategoryItem,
            index === filteredItems.length - 1 && styles.lastItem,
          ]}
          onPress={() => (isCategory ? handleToggleCategory(item.category) : handleSelect(item))}
        >
          <View style={styles.customLabelContainer}>
            <Text style={styles.itemText}>{displayText}</Text>
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
    <View>
      <Pressable style={styles.container} onPress={() => setVisible(true)}>
        <Text style={[styles.selectedText, { color: selectedItem ? 'black' : 'gray' }]}>
          {selectedItem
            ? `${selectedItem.category}${
                selectedItem.subCategory ? ` - ${selectedItem.subCategory.name}` : ''
              }`
            : 'Select category'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.black}
          style={visible && styles.arrowUp}
        />
      </Pressable>
      {selectedItem && <Animated.Text style={labelStyle}>Category</Animated.Text>}

      <Modal visible={visible} animationType="fade" transparent>
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <TextInput
                  style={styles.input}
                  placeholder="Search"
                  placeholderTextColor="gray"
                  value={search}
                  onChangeText={setSearch}
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
                        setVisible(false);
                        onOpenCustomSheet?.(search); // Pass the current search value up to the form
                      }}
                      title="Create custom category"
                    />
                  </View>
                ) : (
                  <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={(item, index) =>
                      `${item.category}-${item.subCategory?.name}-${index}`
                    }
                    keyboardShouldPersistTaps="handled"
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: colors.lightGrey,
  },
  selectedText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: 400,
    padding: 20,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: 'black',
    fontSize: 14,
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
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  arrowDown: {
    transform: [{ rotate: '0deg' }],
  },
  arrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  customTag: {
    color: 'gray',
    fontSize: 13,
  },
});

export default CustomDropdown;
