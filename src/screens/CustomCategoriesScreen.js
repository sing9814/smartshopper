import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import CustomCategorySheet from '../components/customCategorySheet';
import Banner from '../components/banner';
import ConfirmationModal from '../components/confirmationModal';
import { deleteDoc } from '../utils/firebase';
import { setCustomCategories, setCategories } from '../redux/actions/userActions';
import { useDispatch } from 'react-redux';

const CustomCategoriesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const colors = useTheme();
  const styles = createStyles(colors);

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const [banner, setBanner] = useState(null);
  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  const customCategories = useSelector((state) => state.user.customCategories);
  const categories = useSelector((state) => state.user.categories);

  const renderItem = ({ item }) => (
    <View style={styles.categoryRow}>
      <View style={[styles.pill, { backgroundColor: colors[item.category.split(' ')[0]] }]}>
        <Text style={styles.pillText}>{item.name}</Text>
      </View>

      <View style={styles.iconContainer}>
        <TouchableOpacity
          onPress={() => {
            setEditingCategory(item);
            setShowEditSheet(true);
          }}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.gray} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setPendingDelete(item);
            setShowDeletePopup(true);
          }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <FlatList
          data={customCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </View>

      <CustomCategorySheet
        visible={showEditSheet}
        onClose={() => {
          setShowEditSheet(false);
          setEditingCategory(null);
        }}
        items={categories}
        initialSubcategoryName={editingCategory?.name || ''}
        editingCategory={editingCategory}
        onSave={(wasSaved) => {
          if (wasSaved) {
            showBanner('Category updated!', 'success');
          } else {
            showBanner('Failed to update category.');
          }
          setShowEditSheet(false);
          setEditingCategory(null);
        }}
      />

      <ConfirmationModal
        data={pendingDelete?.name}
        visible={showDeletePopup}
        onCancel={() => {
          setShowDeletePopup(false);
          setPendingDelete(null);
        }}
        onConfirm={async () => {
          try {
            await deleteDoc('customCategories', pendingDelete.id);

            const updatedCustoms = customCategories.filter((c) => c.id !== pendingDelete.id);
            dispatch(setCustomCategories(updatedCustoms));

            const updatedCategories = categories.map((cat) => ({
              ...cat,
              subCategories: cat.subCategories.filter((sub) => sub.id !== pendingDelete.id),
            }));
            dispatch(setCategories(updatedCategories));

            showBanner('Category deleted!', 'success');
          } catch (err) {
            showBanner('Failed to delete category.');
          }

          setShowDeletePopup(false);
          setPendingDelete(null);
        }}
      />
    </>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.bg,
    },
    topbar: {
      width: '100%',
      backgroundColor: colors.primary,
      gap: 6,
      paddingTop: 10,
      paddingBottom: 13,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      justifyContent: 'space-between',
    },
    pill: {
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    pillText: {
      color: colors.white,
    },
    iconContainer: {
      flexDirection: 'row',
      gap: 16,
    },
  });

export default CustomCategoriesScreen;
