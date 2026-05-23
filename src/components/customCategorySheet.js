import { useState, useEffect } from 'react';
import { Text, TextInput, StyleSheet, View } from 'react-native';
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

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        setCustomName(editingCategory.name);
      } else {
        setCustomName(initialSubcategoryName);
      }
    }
  }, [visible, initialSubcategoryName, editingCategory]);

  const handleSave = async () => {
    if (!customName) return;

    const id = editingCategory?.id || uuid.v4();
    const payload = {
      id,
      category: customName,
    };

    const wasSaved = editingCategory
      ? await updateCustomCategory(payload)
      : await saveCustomCategory(payload);

    if (!wasSaved) return;

    const updatedCustoms = editingCategory
      ? customCategories.map((c) => (c.id === id ? { ...c, name: customName } : c))
      : [...customCategories, { id, name: customName }];
    dispatch(setCustomCategories(updatedCustoms));

    const updatedCategories = editingCategory
      ? categories
          .map((cat) => ({
            ...cat,
            name: cat.id === id ? customName : cat.name,
            subCategories: (cat.subCategories || []).filter((sub) => sub.id !== id),
          }))
          .concat(
            categories.some((cat) => cat.id === id)
              ? []
              : [{ id, name: customName, custom: true, subCategories: [] }]
          )
      : [...categories, { id, name: customName, custom: true, subCategories: [] }];

    dispatch(setCategories(updatedCategories));

    onSave?.(
      {
        id,
        category: customName,
        subCategory: null,
        custom: true,
      },
      wasSaved
    );

    onClose();
    setCustomName('');
  };

  return (
    <BottomSheet
      title={editingCategory ? 'Edit Custom Category' : 'Create Custom Category'}
      visible={visible}
      onClose={onClose}
      height={300}
    >
      <View style={styles.content}>
        <View>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="Enter category name"
            value={customName}
            onChangeText={setCustomName}
          />
        </View>

        <CustomButton
          title={editingCategory ? 'Save changes' : 'Add category'}
          onPress={handleSave}
        />
      </View>
    </BottomSheet>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      width: '100%',
      justifyContent: 'space-between',
      paddingBottom: 120,
    },
    label: {
      color: colors.gray,
      fontWeight: '500',
      alignSelf: 'flex-start',
      marginBottom: 2,
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
  });

export default CustomCategorySheet;
