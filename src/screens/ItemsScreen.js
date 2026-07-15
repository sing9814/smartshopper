import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../theme/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ConfirmationModal from '../components/confirmationModal';
import { addItemsToCollections, deleteDoc, updatePurchaseWears } from '../utils/firebase';
import { setCollections, setCurrentPurchase, setPurchases } from '../redux/actions/purchaseActions';
import Banner from '../components/banner';
import { useStatusBar } from '../hooks/useStatusBar';
import BottomSheet from '../components/bottomSheet';
import CustomButton from '../components/button';
import ItemsBrowser from '../components/itemsBrowser';
import {
  generateFirestoreTimestampFromDate,
  getDateKeyInTimeZone,
  getDeviceTimeZone,
  timestampToDate,
} from '../utils/date';

const sortWearsByDate = (wears) => {
  return [...wears].sort((a, b) => {
    const aTime = timestampToDate(a)?.getTime() || 0;
    const bTime = timestampToDate(b)?.getTime() || 0;

    return aTime - bTime;
  });
};

const hasWearLoggedOnDate = (item, dateKey, timeZone) => {
  return (item.wears || []).some((wear) => getDateKeyInTimeZone(wear, timeZone) === dateKey);
};

const ItemsScreen = ({ navigation, selectedItems, setSelectedItems }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const timeZone = getDeviceTimeZone();
  useStatusBar(colors.primary);

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([]);

  const purchases = useSelector((state) => state.purchase.purchases);
  const collections = useSelector((state) => state.purchase.collections);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState('');
  const [banner, setBanner] = useState(null);
  const [collectionSheetVisible, setCollectionSheetVisible] = useState(false);
  const [addingWearItemId, setAddingWearItemId] = useState(null);

  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  const fetchData = async () => {
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleItemLongPress = (item) => {
    setSelectedItems((prev) =>
      prev.includes(item.key) ? prev.filter((id) => id !== item.key) : [...prev, item.key]
    );
  };

  const handleTrashPress = () => {
    setModalData(`${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`);
    setModalVisible(true);
  };

  const clearSelection = () => setSelectedItems([]);

  const getWearUpdateForItem = (item, wearDate, wearDateKey) => {
    const latestItem = purchases.find((purchase) => purchase.key === item.key) || item;

    if (hasWearLoggedOnDate(latestItem, wearDateKey, timeZone)) {
      return null;
    }

    const newWear = generateFirestoreTimestampFromDate(wearDate);
    const newWears = sortWearsByDate([...(latestItem.wears || []), newWear]);

    return {
      item: latestItem,
      updatedItem: { ...latestItem, wears: newWears },
      wears: newWears,
    };
  };

  const isWearLoggedToday = (item) => {
    const todayKey = getDateKeyInTimeZone(new Date(), timeZone);
    return hasWearLoggedOnDate(item, todayKey, timeZone);
  };

  const handleAddToCollections = async () => {
    try {
      await addItemsToCollections(selectedItems, selectedCollections);

      const updatedCollections = collections.map((collection) => {
        if (selectedCollections.includes(collection.id)) {
          const newItemIds = Array.from(new Set([...(collection.items || []), ...selectedItems]));
          return { ...collection, items: newItemIds };
        }
        return collection;
      });

      dispatch(setCollections(updatedCollections));

      showBanner('Added items to collections', 'success');
      setCollectionSheetVisible(false);
      setSelectedCollections([]);
      setSelectedItems([]);
    } catch (err) {
      console.error(err);
      showBanner('Failed to add items to collections');
    }
  };

  const handleAddWear = async (item) => {
    if (addingWearItemId) return;

    const wearDate = new Date();
    const wearDateKey = getDateKeyInTimeZone(wearDate, timeZone);
    const wearUpdate = getWearUpdateForItem(item, wearDate, wearDateKey);

    if (!wearUpdate) {
      return;
    }

    setAddingWearItemId(item.key);

    const updatedPurchases = purchases.map((purchase) =>
      purchase.key === item.key ? wearUpdate.updatedItem : purchase
    );

    dispatch(setPurchases(updatedPurchases));
    dispatch(setCurrentPurchase(wearUpdate.updatedItem));

    try {
      await updatePurchaseWears(item.key, wearUpdate.wears);
      showBanner('Wear added for today', 'success');
    } finally {
      setAddingWearItemId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await Promise.all(selectedItems.map((id) => deleteDoc('Purchases', id)));

      const remaining = purchases.filter((p) => !selectedItems.includes(p.key));
      dispatch(setPurchases(remaining));
      setSelectedItems([]);
      setModalVisible(false);

      showBanner(`${selectedItems.length} item(s) deleted successfully`, 'success');
    } catch (error) {
      console.error('Failed to delete items:', error);
      showBanner('Failed to delete some items. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {selectedItems.length > 0 ? (
        <View style={styles.selectionHeader}>
          <View style={styles.selectionClose}>
            <TouchableOpacity onPress={clearSelection}>
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{`${selectedItems.length} selected`}</Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={() => setCollectionSheetVisible(true)}>
              <Ionicons name="add-circle-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTrashPress}>
              <Ionicons name="trash-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}

      <ConfirmationModal
        data={modalData}
        visible={modalVisible}
        onConfirm={handleDelete}
        onCancel={() => setModalVisible(false)}
      />
      <ItemsBrowser
        purchases={purchases}
        navigation={navigation}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        selectedItems={selectedItems}
        onItemToggle={handleItemLongPress}
        onAddWear={handleAddWear}
        addingWearItemId={addingWearItemId}
        isWearLoggedToday={isWearLoggedToday}
      />
      <BottomSheet
        visible={collectionSheetVisible}
        onClose={() => setCollectionSheetVisible(false)}
        title="Add to Collections"
        height="50%"
      >
        <ScrollView style={styles.scrollList}>
          {collections.map((collection) => {
            const isSelected = selectedCollections.includes(collection.id);
            return (
              <TouchableOpacity
                key={collection.id}
                style={styles.sheetRow}
                onPress={() => {
                  setSelectedCollections((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== collection.id)
                      : [...prev, collection.id]
                  );
                }}
              >
                <View style={styles.collection}>
                  <View style={styles.row}>
                    <Text style={styles.sheetRowName}>{collection.name}</Text>
                    <Text style={styles.sheetRowDesc}>
                      ({collection.items.length} {collection.items.length !== 1 ? 'items' : 'item'})
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isSelected ? 'checkmark-circle-outline' : 'ellipse-outline'}
                  size={22}
                  color={isSelected ? colors.primary : colors.gray}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <CustomButton
          title="Add selected items"
          onPress={handleAddToCollections}
          buttonStyle={styles.sheetButton}
        />
      </BottomSheet>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    selectionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    selectionHeader: {
      backgroundColor: colors.primary,
      paddingTop: 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectionClose: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      color: 'white',
    },
    scrollList: {
      maxHeight: 200,
      width: '100%',
      flex: 1,
    },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
    },
    collection: {
      gap: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sheetRowName: {
      fontSize: 15,
      color: colors.black,
      fontWeight: '500',
      marginRight: 6,
    },
    sheetRowDesc: {
      color: colors.gray,
    },
    sheetButton: {
      marginHorizontal: 12,
      position: 'absolute',
      bottom: 110,
    },
  });

export default ItemsScreen;
