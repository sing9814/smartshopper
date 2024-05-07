import React, { useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import colors from '../utils/colors';

const CustomDropdown = ({ items, onSelect, selectedItem, setSelectedItem }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const animatedValue = useState(new Animated.Value(0))[0];

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
    fontSize: 12,
    color: colors.primary,
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect(item.name);
        setSelectedItem(item);
        setVisible(false);
      }}
    >
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDropdownText = () => {
    if (selectedItem) {
      return selectedItem.name;
    } else {
      return 'Select an item';
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.container} onPress={() => setVisible(true)}>
        <Text>{renderDropdownText()}</Text>
      </TouchableOpacity>
      <Modal visible={visible} animationType="slide">
        <View style={styles.modal}>
          <TextInput
            style={styles.input}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.name.toString()}
          />
          <TouchableOpacity onPress={() => setVisible(false)}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {selectedItem && <Animated.Text style={labelStyle}>Brand</Animated.Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    color: colors.black,
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modal: {
    flex: 1,
    marginTop: 50,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default CustomDropdown;
