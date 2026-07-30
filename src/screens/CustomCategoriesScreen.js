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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const CATEGORY_LONG_PRESS_HINT_KEY = '@smartshopper/category-long-press-hint-seen-v3';

const CustomCategoriesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const colors = useTheme();
  const styles = createStyles(colors);

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showLongPressHint, setShowLongPressHint] = useState(false);

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

  useEffect(() => {
    AsyncStorage.getItem(CATEGORY_LONG_PRESS_HINT_KEY)
      .then((hasSeenHint) => setShowLongPressHint(hasSeenHint !== 'true'))
      .catch(() => setShowLongPressHint(true));
  }, []);

  const openCategoryOptions = (category) => {
    setSelectedCategory(category);

    if (showLongPressHint) {
      setShowLongPressHint(false);
      AsyncStorage.setItem(CATEGORY_LONG_PRESS_HINT_KEY, 'true').catch(() => {});
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryRow}
      onLongPress={() => openCategoryOptions(item)}
      delayLongPress={350}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityHint="Long press to edit or delete this category"
    >
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
    </TouchableOpacity>
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
            setEditingCategory(null);
            setShowEditSheet(true);
          }}
          hitSlop={8}
          style={styles.topbarAction}
          accessibilityRole="button"
          accessibilityLabel="Add category"
        >
          <Ionicons name="add" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {customCategories.length > 0 && showLongPressHint && (
          <View style={styles.listHint} pointerEvents="none">
            <Text style={styles.listHintText}>Press and hold a category for options.</Text>
          </View>
        )}
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
          if (!wasSaved) showBanner('Failed to save category.');
          setShowEditSheet(false);
          setEditingCategory(null);
        }}
      />

      <OptionsSheet
        visible={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        title={selectedCategory?.name}
        options={[
          {
            label: 'Edit',
            icon: <FontAwesome name="pencil" size={20} color={colors.black} />,
            onPress: () => {
              setEditingCategory(selectedCategory);
              setShowEditSheet(true);
            },
          },
          {
            label: 'Delete',
            icon: <Ionicons name="trash-outline" size={20} color={colors.red} />,
            destructive: true,
            onPress: () => {
              setPendingDelete(selectedCategory);
              setShowDeletePopup(true);
            },
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
    listHint: {
      position: 'absolute',
      bottom: 72,
      alignSelf: 'center',
      zIndex: 2,
      elevation: 3,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.black,
    },
    listHintText: {
      color: colors.white,
      fontSize: 13,
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
