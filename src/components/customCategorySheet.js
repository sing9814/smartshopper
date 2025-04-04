import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import BottomSheet from './bottomSheet';
import CustomButton from './button';
import colors from '../utils/colors';

const CustomCategorySheet = ({ visible, onClose, items, onSave, initialSubcategoryName = '' }) => {
  const [customName, setCustomName] = useState(initialSubcategoryName);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const handleSave = () => {
    if (!customName || !selectedCategoryName) return;
    onSave({ category: selectedCategoryName, subCategory: customName });
    setCustomName('');
    setSelectedCategoryName('');
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setCustomName(initialSubcategoryName);
    }
  }, [visible, initialSubcategoryName]);

  return (
    <BottomSheet title={'Create Custom Category'} visible={visible} onClose={onClose} height="60%">
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.sheetInput}
        placeholder="Enter category name"
        value={customName}
        onChangeText={setCustomName}
      />

      <Text style={styles.label}>
        Group <Text style={{ color: 'gray' }}>(Selected: {selectedCategoryName || 'None'})</Text>
      </Text>

      <View style={styles.categoryButtonGroup}>
        {items.map((item) => {
          const isSelected = selectedCategoryName === item.name;
          const baseName = item.name.split(' ')[0];
          const buttonColor = colors[baseName] || '#ccc';

          return (
            <Pressable
              key={item.name}
              onPress={() => setSelectedCategoryName(item.name)}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected ? buttonColor : '#f0f0f0',
                  borderColor: isSelected ? buttonColor : '#ccc',
                },
              ]}
            >
              <Text style={{ color: isSelected ? 'white' : 'black' }}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <CustomButton
        title="Save new category"
        buttonStyle={{ marginTop: 20 }}
        onPress={handleSave}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 10,
  },
  sheetInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.black,
    fontSize: 14,
  },
  categoryButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    justifyContent: 'flex-start',
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});

export default CustomCategorySheet;
