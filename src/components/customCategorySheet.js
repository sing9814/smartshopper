import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import BottomSheet from './bottomSheet';
import CustomButton from './button';
import { useTheme } from '../theme/themeContext';
import { saveCustomCategory } from '../utils/firebase';

const CustomCategorySheet = ({ visible, onClose, items, initialSubcategoryName = '', onSave }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const [customName, setCustomName] = useState(initialSubcategoryName);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  useEffect(() => {
    if (visible) {
      setCustomName(initialSubcategoryName);
    }
  }, [visible, initialSubcategoryName]);

  const handleSave = async () => {
    if (!customName || !selectedCategoryName) return;

    const wasSaved = await saveCustomCategory({
      category: selectedCategoryName,
      subCategory: customName,
    });

    onSave?.(
      {
        category: selectedCategoryName,
        subCategory: { name: customName, custom: true },
      },
      wasSaved
    );

    onClose();
    setCustomName('');
    setSelectedCategoryName('');
  };

  return (
    <BottomSheet title="Create Custom Category" visible={visible} onClose={onClose} height={450}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.sheetInput}
        placeholder="Enter category name"
        value={customName}
        onChangeText={setCustomName}
      />

      <View style={styles.selectedContainer}>
        <Text style={styles.label}>Group </Text>
        <Text style={{ color: colors.gray }}>(Selected: {selectedCategoryName || 'None'})</Text>
      </View>

      <View style={styles.categoryButtonGroup}>
        {items.map((item) => {
          const isSelected = selectedCategoryName === item.name;
          const baseName = item.name.split(' ')[0];
          const buttonColor = colors[baseName] || colors.lightGrey;

          return (
            <Pressable
              key={item.name}
              onPress={() => setSelectedCategoryName(item.name)}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected ? buttonColor : colors.lightestGrey,
                  borderColor: isSelected ? buttonColor : colors.lightGrey,
                },
              ]}
            >
              <Text style={{ color: isSelected ? colors.white : colors.black }}>{item.name}</Text>
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

const createStyles = (colors) =>
  StyleSheet.create({
    selectedContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginBottom: 6,
    },
    label: {
      color: colors.black,
      fontSize: 14,
      fontWeight: '500',
      alignSelf: 'flex-start',
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
      marginBottom: 10,
    },
    categoryButtonGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 6,
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
