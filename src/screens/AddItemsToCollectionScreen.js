import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';
import ItemsBrowser from '../components/itemsBrowser';
import Banner from '../components/banner';
import { addItemsToCollections } from '../utils/firebase';
import { setCollections } from '../redux/actions/purchaseActions';

const AddItemsToCollectionScreen = ({ navigation, route }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase.purchases);
  const collections = useSelector((state) => state.purchase.collections);
  const [selectedItems, setSelectedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  const collectionId = route.params?.addToCollectionId;
  const collection = collections.find((item) => item.id === collectionId);
  const collectionName = route.params?.addToCollectionName || collection?.name || 'collection';
  const availablePurchases = purchases.filter(
    (purchase) => !(collection?.items || []).includes(purchase.key)
  );

  const toggleItem = (item) => {
    setSelectedItems((previous) =>
      previous.includes(item.key)
        ? previous.filter((itemId) => itemId !== item.key)
        : [...previous, item.key]
    );
  };

  const saveItems = async () => {
    if (!collection || selectedItems.length === 0 || saving) return;

    setSaving(true);

    try {
      await addItemsToCollections(selectedItems, [collection.id]);

      dispatch(
        setCollections(
          collections.map((item) =>
            item.id === collection.id
              ? {
                  ...item,
                  items: Array.from(new Set([...(item.items || []), ...selectedItems])),
                }
              : item
          )
        )
      );
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add items to collection:', error);
      setBanner({ message: 'Failed to add items to this collection', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderSelectionIndicator = (item) => {
    const isSelected = selectedItems.includes(item.key);

    return (
      <Ionicons
        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
        size={23}
        color={isSelected ? colors.primary : colors.lightGrey}
      />
    );
  };

  const allItemsAdded = purchases.length > 0 && availablePurchases.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Cancel adding items"
        >
          <Text style={styles.headerAction}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Add to {collectionName}
          </Text>
          <Text style={styles.selectionCount}>
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </Text>
        </View>
        <TouchableOpacity
          onPress={saveItems}
          disabled={selectedItems.length === 0 || saving}
          accessibilityRole="button"
          accessibilityLabel="Save selected items to collection"
        >
          <Text
            style={[
              styles.headerAction,
              (selectedItems.length === 0 || saving) && styles.headerActionDisabled,
            ]}
          >
            {saving ? 'Saving' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}

      <ItemsBrowser
        purchases={availablePurchases}
        navigation={navigation}
        loading={false}
        refreshing={false}
        onRefresh={() => {}}
        selectedItems={selectedItems}
        onItemToggle={toggleItem}
        selectionMode
        renderEndAction={renderSelectionIndicator}
        emptyMessage={allItemsAdded ? 'All items are already in this collection' : 'No items found'}
        emptyHint={allItemsAdded ? 'There are no more items to add' : 'Pull down to refresh'}
      />
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      backgroundColor: colors.primaryDark,
      paddingTop: 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    headerTitle: { fontSize: 18, color: 'white' },
    selectionCount: { color: 'white', fontSize: 12, opacity: 0.8, marginTop: 2 },
    headerAction: { color: 'white', fontSize: 15, fontWeight: '600' },
    headerActionDisabled: { opacity: 0.45 },
  });

export default AddItemsToCollectionScreen;
