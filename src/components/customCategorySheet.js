import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import BottomSheet from './bottomSheet';
import CustomButton from './button';
import { useTheme } from '../theme/themeContext';
import { useDispatch, useSelector } from 'react-redux';
import { saveCustomCategory, updateCustomCategory } from '../utils/firebase';
import { setCustomCategories, setCategories } from '../redux/actions/userActions';
import uuid from 'react-native-uuid';

const CustomCategorySheet = ({
  visible,
  onClose,
  items,
  initialSubcategoryName = '',
  onSave,
  editingCategory = null,
}) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch();

  const customCategories = useSelector((state) => state.user.customCategories);
  const categories = useSelector((state) => state.user.categories);

  const [customName, setCustomName] = useState(initialSubcategoryName);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        setCustomName(editingCategory.name);
        setSelectedCategoryName(editingCategory.category);
      } else {
        setCustomName(initialSubcategoryName);
        setSelectedCategoryName('');
      }
    }
  }, [visible, initialSubcategoryName, editingCategory]);

  const handleSave = async () => {
    if (!customName || !selectedCategoryName) return;

    const id = editingCategory?.id || uuid.v4();
    const payload = {
      id,
      category: selectedCategoryName,
      subCategory: customName,
    };

    const wasSaved = editingCategory
      ? await updateCustomCategory(payload)
      : await saveCustomCategory(payload);

    if (!wasSaved) return;

    const updatedCustoms = editingCategory
      ? customCategories.map((c) =>
          c.id === id ? { ...c, name: customName, category: selectedCategoryName } : c
        )
      : [...customCategories, { id, name: customName, category: selectedCategoryName }];
    dispatch(setCustomCategories(updatedCustoms));

    const updatedCategories = categories.map((cat) => ({
      ...cat,
      subCategories: editingCategory
        ? cat.subCategories.filter((sub) => sub.id !== editingCategory.id)
        : cat.subCategories,
    }));

    const targetGroup = updatedCategories.find((cat) => cat.name === selectedCategoryName);
    if (targetGroup) {
      targetGroup.subCategories.push({ id, name: customName, custom: true });
    }

    dispatch(setCategories(updatedCategories));

    onSave?.(
      {
        id,
        category: selectedCategoryName,
        subCategory: { id, name: customName, custom: true },
      },
      wasSaved
    );

    onClose();
    setCustomName('');
    setSelectedCategoryName('');
  };

  return (
    <BottomSheet
      title={editingCategory ? 'Edit Custom Category' : 'Create Custom Category'}
      visible={visible}
      onClose={onClose}
      height={450}
    >
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
        title={editingCategory ? 'Save Changes' : 'Save New Category'}
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
