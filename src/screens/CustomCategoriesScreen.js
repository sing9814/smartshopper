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
import OptionsSheet from '../components/optionsSheet';
import CustomButton from '../components/button';

const CustomCategoriesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const colors = useTheme();
  const styles = createStyles(colors);

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [managementMode, setManagementMode] = useState(null);
  const [showMenuSheet, setShowMenuSheet] = useState(false);

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

      {managementMode && (
        <View style={styles.rowActions}>
          {managementMode === 'edit' ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setEditingCategory(item);
                setShowEditSheet(true);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
            >
              <FontAwesome name="pencil" size={20} color={colors.black} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setPendingDelete(item);
                setShowDeletePopup(true);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Ionicons name="close" size={22} color={colors.red} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <>
      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.topbarAction}
        >
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>
          Custom categories
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (managementMode) {
              setManagementMode(null);
            } else {
              setShowMenuSheet(true);
            }
          }}
          hitSlop={8}
          style={[styles.topbarAction, managementMode && styles.topbarDoneAction]}
          accessibilityRole="button"
          accessibilityLabel={managementMode ? `Done with ${managementMode} mode` : 'Category menu'}
        >
          {managementMode ? (
            <Text style={styles.topbarDone}>Done</Text>
          ) : (
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          )}
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
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>Create your own categories.</Text>
              <CustomButton
                title="Add category"
                onPress={() => {
                  setEditingCategory(null);
                  setShowEditSheet(true);
                }}
              />
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
            showBanner(editingCategory ? 'Category updated!' : 'Category added!', 'success');
          } else {
            showBanner('Failed to update category.');
          }
          setShowEditSheet(false);
          setEditingCategory(null);
        }}
      />

      <OptionsSheet
        visible={showMenuSheet}
        onClose={() => setShowMenuSheet(false)}
        title="Custom categories"
        options={[
          {
            label: 'Add category',
            icon: <Ionicons name="add-circle-outline" size={20} color={colors.black} />,
            onPress: () => {
              setEditingCategory(null);
              setShowEditSheet(true);
            },
          },
          {
            label: 'Edit categories',
            icon: <FontAwesome name="pencil" size={20} color={colors.black} />,
            onPress: () => setManagementMode('edit'),
          },
          {
            label: 'Delete categories',
            icon: <Ionicons name="trash-outline" size={20} color={colors.red} />,
            destructive: true,
            onPress: () => setManagementMode('delete'),
          },
        ]}
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
              subCategories: (cat.subCategories || []).filter((sub) => sub.id !== pendingDelete.id),
            }));
            dispatch(setCategories(updatedCategories.filter((cat) => cat.id !== pendingDelete.id)));

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
      backgroundColor: colors.bg,
    },
    topbar: {
      width: '100%',
      backgroundColor: colors.primary,
      gap: 12,
      paddingTop: 10,
      paddingBottom: 13,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topbarAction: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topbarDoneAction: {
      width: 48,
      marginLeft: -20,
    },
    topbarDone: {
      color: 'white',
      fontSize: 15,
      fontWeight: '500',
    },
    topbarTitle: {
      color: 'white',
      flex: 1,
      fontSize: 18,
      textAlign: 'center',
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
      height: 56,
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
    rowActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
      gap: 6,
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
      marginBottom: 10,
    },
  });

export default CustomCategoriesScreen;
