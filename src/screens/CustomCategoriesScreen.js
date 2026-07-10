import { FlatList, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
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
import BottomSheet from '../components/bottomSheet';

const CustomCategoriesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const colors = useTheme();
  const styles = createStyles(colors);

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

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
      <View style={styles.categoryInfo}>
        <View style={styles.categoryTextBlock}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.category && (
            <Text style={styles.categoryParent} numberOfLines={1}>
              {`•  ${item.category}`}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => {
          setSelectedCategory(item);
          setShowActionSheet(true);
        }}
        hitSlop={8}
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.gray} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.topbarIcon}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom subcategories</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingCategory(null);
            setShowEditSheet(true);
          }}
          hitSlop={8}
          style={styles.topbarIcon}
        >
          <Ionicons name="add-circle-outline" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <FlatList
          data={customCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            customCategories.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="pricetag-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No custom subcategories yet</Text>
              <Text style={styles.emptyText}>Create your own subcategories under a category.</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => {
                  setEditingCategory(null);
                  setShowEditSheet(true);
                }}
              >
                <Text style={styles.emptyButtonText}>Add subcategory</Text>
              </TouchableOpacity>
            </View>
          }
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
        onSave={(_, wasSaved) => {
          if (wasSaved) {
            showBanner(editingCategory ? 'Subcategory updated!' : 'Subcategory added!', 'success');
          } else {
            showBanner('Failed to update subcategory.');
          }
          setShowEditSheet(false);
          setEditingCategory(null);
        }}
      />

      <BottomSheet
        visible={showActionSheet}
        onClose={() => {
          setShowActionSheet(false);
          setSelectedCategory(null);
        }}
        title="Subcategory options"
        height={210}
      >
        <Pressable
          style={styles.sheetRow}
          onPress={() => {
            setShowActionSheet(false);
            setEditingCategory(selectedCategory);
            setShowEditSheet(true);
          }}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.black} style={styles.sheetIcon} />
          <Text style={styles.sheetText}>Edit subcategory</Text>
        </Pressable>

        <Pressable
          style={styles.sheetRow}
          onPress={() => {
            setShowActionSheet(false);
            setPendingDelete(selectedCategory);
            setShowDeletePopup(true);
          }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.red} style={styles.sheetIcon} />
          <Text style={styles.deleteText}>Delete subcategory</Text>
        </Pressable>
      </BottomSheet>

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
              subCategories: (cat.subCategories || []).filter((sub) => sub.id !== pendingDelete.id),
            }));
            dispatch(setCategories(updatedCategories.filter((cat) => cat.id !== pendingDelete.id)));

            showBanner('Subcategory deleted!', 'success');
          } catch (err) {
            showBanner('Failed to delete subcategory.');
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
    topbarIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: 'white',
      fontSize: 18,
    },
    listContent: {
      paddingTop: 2,
      paddingBottom: 32,
    },
    emptyListContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingVertical: 12,
      paddingHorizontal: 18,
      marginBottom: 1,
      justifyContent: 'space-between',
    },
    categoryInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    categoryTextBlock: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    categoryName: {
      flexShrink: 1,
      color: colors.black,
      fontSize: 15,
      fontWeight: '500',
    },
    categoryParent: {
      color: colors.gray,
    },
    iconButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      marginBottom: 14,
    },
    emptyTitle: {
      color: colors.black,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyText: {
      color: colors.gray,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 16,
    },
    emptyButton: {
      minHeight: 42,
      borderRadius: 10,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    emptyButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    sheetRow: {
      width: '100%',
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sheetIcon: {
      marginRight: 10,
    },
    sheetText: {
      color: colors.black,
      fontSize: 15,
    },
    deleteText: {
      color: colors.red,
      fontSize: 15,
    },
  });

export default CustomCategoriesScreen;
