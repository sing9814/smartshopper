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

const CustomDropdown = ({ items, onSelect, selectedItem, setSelectedItem }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const categoryNames = new Set(items.map((brand) => brand.name));

  const getFilteredItems = () => {
    return items
      .filter((brand) => {
        const nameMatches = brand.name.toLowerCase().includes(search.toLowerCase());
        const detailsMatch = brand.details.some((detail) =>
          detail.toLowerCase().includes(search.toLowerCase())
        );
        return nameMatches || detailsMatch;
      })
      .flatMap((brand) => {
        if (expandedCategories.has(brand.name) || search) {
          return [
            brand.name,
            ...brand.details
              .filter((detail) => detail.toLowerCase().includes(search.toLowerCase()))
              .map((detail) => `${brand.name} - ${detail}`),
          ];
        }
        return [brand.name];
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
    const [category, subCategory] = item.split(' - ');
    const selectedCategory = categoryNames.has(category) ? category : null;
    const selectedItem = { category: selectedCategory, subCategory };
    onSelect(selectedItem);
    setSelectedItem(selectedItem);
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
      const isCategory = categoryNames.has(item);
      const isExpanded = expandedCategories.has(item.split(' - ')[0]);
      return (
        <TouchableOpacity
          key={`${item}-${index}`}
          style={[
            index !== filteredItems.length - 1 ? styles.item : styles.lastItem,
            !isCategory && styles.detailItem,
          ]}
          onPress={() => (isCategory ? handleToggleCategory(item) : handleSelect(item))}
        >
          <Text style={styles.text}>{item}</Text>
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
                placeholder="Search or add custom"
                placeholderTextColor={'gray'}
                value={search}
                onChangeText={setSearch}
              />
              <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item}-${index}`}
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
  detailItem: {
    paddingLeft: 20,
  },
});

export default CustomDropdown;
