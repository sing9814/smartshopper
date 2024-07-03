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

  const flatItems = items.flatMap((brand) => [brand.name, ...brand.details]);

  const categoryNames = new Set(items.map((brand) => brand.name));

  const filteredItems = flatItems.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

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

  const renderItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.lastItem,
        index !== filteredItems.length - 1 && styles.item,
        !categoryNames.has(item) && styles.detailItem,
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.text}>{item}</Text>
    </TouchableOpacity>
  ));

  return (
    <View>
      <Pressable style={styles.container} onPress={() => setVisible(true)}>
        <Text style={[styles.text, { color: selectedItem ? 'black' : 'gray' }]}>
          {selectedItem || 'Category'}
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
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailItem: {
    paddingLeft: 20,
  },
});

export default CustomDropdown;
