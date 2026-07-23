import { useState, useEffect, useMemo } from 'react';
import {
  Keyboard,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import BottomSheet from './bottomSheet';
import CustomButton from './button';
import { useTheme } from '../theme/themeContext';
import { useDispatch, useSelector } from 'react-redux';
import { saveCustomCategory, updateCustomCategory } from '../utils/firebase';
import { setCustomCategories, setCategories } from '../redux/actions/userActions';
import uuid from 'react-native-uuid';
import CustomInput from './customInput';

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
  const [selectedCategory, setSelectedCategory] = useState('');

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.custom),
    [categories]
  );

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        setCustomName(editingCategory.name);
        setSelectedCategory(editingCategory.category || parentCategories[0]?.name || '');
      } else {
        setCustomName(initialSubcategoryName);
        setSelectedCategory(parentCategories[0]?.name || '');
      }
    }
  }, [visible, initialSubcategoryName, editingCategory, parentCategories]);

  const handleSave = async () => {
    const normalizedName = customName.trim();
    const savedName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);

    if (!savedName || !selectedCategory) return;

    const id = editingCategory?.id || uuid.v4();
    const payload = {
      id,
      category: selectedCategory,
      subCategory: savedName,
    };

    const wasSaved = editingCategory
      ? await updateCustomCategory(payload)
      : await saveCustomCategory(payload);

    if (!wasSaved) return;

    const updatedCustoms = editingCategory
      ? customCategories.map((c) =>
          c.id === id ? { ...c, category: selectedCategory, name: savedName } : c
        )
      : [...customCategories, { id, category: selectedCategory, name: savedName }];
    dispatch(setCustomCategories(updatedCustoms));

    const updatedCategories = categories.map((cat) => {
      const subCategories = (cat.subCategories || []).filter((sub) => sub.id !== id);

      if (cat.name !== selectedCategory) {
        return {
          ...cat,
          subCategories,
        };
      }

      return {
        ...cat,
        subCategories: [...subCategories, { id, name: savedName, custom: true }],
      };
    });

    dispatch(setCategories(updatedCategories));

    onSave?.(
      {
        id,
        category: selectedCategory,
        subCategory: {
          id,
          name: savedName,
          custom: true,
        },
        custom: true,
      },
      wasSaved
    );

    onClose();
    setCustomName('');
  };

  return (
    <BottomSheet
      title={editingCategory ? 'Edit Subcategory' : 'Add subcategory'}
      visible={visible}
      onClose={onClose}
      height={420}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          <View style={styles.fields}>
            <CustomInput
              style={styles.sheetInput}
              placeholder="Enter subcategory name"
              value={customName}
              onChangeText={setCustomName}
            />

            <Text style={styles.label}>Belongs to</Text>
            <ScrollView
              style={styles.categoryList}
              contentContainerStyle={styles.categoryOptions}
              keyboardShouldPersistTaps="handled"
            >
              {parentCategories.map((category) => {
                const isSelected = selectedCategory === category.name;

                return (
                  <TouchableOpacity
                    key={category.name}
                    style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setSelectedCategory(category.name);
                    }}
                  >
                    <Text
                      style={[styles.categoryName, isSelected && styles.categoryNameSelected]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <CustomButton title={editingCategory ? 'Save changes' : 'Create'} onPress={handleSave} />
        </View>
      </TouchableWithoutFeedback>
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
    fields: {
      gap: 8,
      paddingTop: 8,
    },
    label: {
      color: colors.gray,
      alignSelf: 'flex-start',
      marginTop: 4,
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
    categoryList: {
      maxHeight: 180,
      width: '100%',
    },
    categoryOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 2,
    },
    categoryPill: {
      minHeight: 34,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.lightGrey,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    categoryPillSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    categoryName: {
      color: colors.black,
    },
    categoryNameSelected: {
      color: colors.white,
    },
  });

export default CustomCategorySheet;
