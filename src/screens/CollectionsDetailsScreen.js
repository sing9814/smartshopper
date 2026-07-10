import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useDispatch, useSelector } from 'react-redux';
import PurchaseList from '../components/purchaseList';
import { useStatusBar } from '../hooks/useStatusBar';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { setCollections, setPurchases } from '../redux/actions/purchaseActions';
import {
  deleteDoc,
  removeItemsFromCollection,
  updateMultiplePurchaseWears,
} from '../utils/firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Banner from '../components/banner';
import ConfirmationModal from '../components/confirmationModal';
import BottomSheet from '../components/bottomSheet';
import {
  formatTimeStampNoTime,
  generateFirestoreTimestampFromDate,
  getDateKeyInTimeZone,
  getDeviceTimeZone,
  timestampToDate,
} from '../utils/date';

const sortWearsByDate = (wears) =>
  [...wears].sort((a, b) => {
    const aTime = timestampToDate(a)?.getTime() || 0;
    const bTime = timestampToDate(b)?.getTime() || 0;

    return aTime - bTime;
  });

const CollectionDetailScreen = ({ route, navigation }) => {
  const { collection } = route.params;
  const colors = useTheme();
  const styles = createStyles(colors);

  const [banner, setBanner] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [isAddingWears, setIsAddingWears] = useState(false);
  const [isRemovingItems, setIsRemovingItems] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);

  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  useStatusBar(colors.primaryDark);

  const dispatch = useDispatch();
  const collections = useSelector((state) => state.purchase.collections);
  const purchases = useSelector((state) => state.purchase.purchases);

  const currentCollection = collections.find((item) => item.id === collection.id) || collection;
  const collectionItemIds = currentCollection.items || [];
  const itemsInCollection = purchases.filter((item) => collectionItemIds.includes(item.key));
  const itemCount = itemsInCollection.length;
  const createdDate = formatTimeStampNoTime(currentCollection.dateCreated);
  const timeZone = getDeviceTimeZone();

  const handleWearCollectionToday = async () => {
    if (isAddingWears || itemCount === 0) return;

    const wearDate = new Date();
    const todayKey = getDateKeyInTimeZone(wearDate, timeZone);
    const newWear = generateFirestoreTimestampFromDate(wearDate);
    const updates = itemsInCollection
      .filter(
        (item) =>
          !(item.wears || []).some((wear) => getDateKeyInTimeZone(wear, timeZone) === todayKey)
      )
      .map((item) => ({
        purchaseId: item.key,
        updatedItem: {
          ...item,
          wears: sortWearsByDate([...(item.wears || []), newWear]),
        },
      }));

    if (updates.length === 0) {
      showBanner('Every item in this collection is already worn today', 'success');
      return;
    }

    setIsAddingWears(true);

    try {
      await updateMultiplePurchaseWears(
        updates.map(({ purchaseId, updatedItem }) => ({
          purchaseId,
          wears: updatedItem.wears,
        }))
      );

      const updatesById = new Map(
        updates.map(({ purchaseId, updatedItem }) => [purchaseId, updatedItem])
      );
      dispatch(
        setPurchases(purchases.map((purchase) => updatesById.get(purchase.key) || purchase))
      );

      const skippedCount = itemCount - updates.length;
      const addedText = `${updates.length} wear${updates.length === 1 ? '' : 's'} added`;
      const skippedText = skippedCount > 0 ? `, ${skippedCount} already worn today` : '';
      showBanner(`${addedText}${skippedText}`, 'success');
    } catch (error) {
      console.error('Failed to wear collection:', error);
      showBanner('Failed to add wears for this collection');
    } finally {
      setIsAddingWears(false);
    }
  };

  const confirmDeleteCollection = async () => {
    try {
      await deleteDoc('Collections', currentCollection.id);

      const updated = collections.filter((c) => c.id !== currentCollection.id);
      dispatch(setCollections(updated));

      setModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      showBanner('Failed to delete collection');
      setModalVisible(false);
    }
  };

  const removeItemFromCollection = async () => {
    if (!itemToRemove || removingItemId) return;

    const updatedCollection = {
      ...currentCollection,
      items: collectionItemIds.filter((itemId) => itemId !== itemToRemove.key),
    };

    setRemovingItemId(itemToRemove.key);

    try {
      await removeItemsFromCollection([itemToRemove.key], currentCollection.id);
      dispatch(
        setCollections(
          collections.map((savedCollection) =>
            savedCollection.id === currentCollection.id ? updatedCollection : savedCollection
          )
        )
      );
      setItemToRemove(null);
      if (updatedCollection.items.length === 0) {
        setIsRemovingItems(false);
      }
      showBanner(`${itemToRemove.name} removed`, 'success');
    } catch (error) {
      console.error('Failed to remove item from collection:', error);
      showBanner('Failed to remove item');
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <View style={styles.container}>
      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}
      <ConfirmationModal
        visible={modalVisible}
        onConfirm={confirmDeleteCollection}
        onCancel={() => setModalVisible(false)}
        data={`"${currentCollection.name}"`}
      />
      <ConfirmationModal
        visible={!!itemToRemove}
        title="Remove item?"
        message={
          itemToRemove
            ? `Remove ${itemToRemove.name} from ${currentCollection.name}? The item will stay in your closet.`
            : ''
        }
        confirmText="Remove"
        onConfirm={removeItemFromCollection}
        onCancel={() => {
          if (!removingItemId) setItemToRemove(null);
        }}
      />
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.topbarButton}
        >
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>
          {currentCollection.name}
        </Text>
        <TouchableOpacity
          onPress={() => setActionSheetVisible(true)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.topbarButton}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.innerContainer}>
        {(itemCount > 0 || isRemovingItems) && (
          <View style={styles.actionBar}>
            <Text style={styles.itemCountText}>
              {isRemovingItems
                ? 'Remove items'
                : `${itemCount} ${itemCount !== 1 ? 'items' : 'item'}`}
            </Text>
            {isRemovingItems ? (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setIsRemovingItems(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Done removing items"
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.wearButton, isAddingWears && styles.wearButtonDisabled]}
                onPress={handleWearCollectionToday}
                activeOpacity={0.8}
                disabled={isAddingWears}
                accessibilityRole="button"
                accessibilityLabel={`Wear ${currentCollection.name} today`}
              >
                <Ionicons name="add-circle-outline" size={17} color={colors.primary} />
                <Text style={styles.wearButtonText}>{isAddingWears ? 'Adding...' : 'Wear'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {createdDate && (
          <View style={styles.metaPanel}>
            <Text style={styles.createdText}>Created {createdDate}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Items in this collection</Text>

        {itemCount > 0 ? (
          <PurchaseList
            purchases={itemsInCollection}
            loading={false}
            refreshing={false}
            navigation={navigation}
            disableItemPress={isRemovingItems}
            renderEndAction={
              isRemovingItems
                ? (item) => (
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => setItemToRemove(item)}
                      disabled={removingItemId === item.key}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.name} from ${currentCollection.name}`}
                    >
                      <Ionicons name="close" size={20} color={colors.red} />
                    </TouchableOpacity>
                  )
                : null
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="sad-outline"
              size={34}
              color={colors.primary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No items here yet</Text>
            <Text style={styles.emptyText}>
              Long press items on the Items tab to add to this collection.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ItemTabs', { screen: 'Items' })}
            >
              <Text style={styles.emptyButtonText}>Browse items</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <BottomSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title="Collection options"
        height={280}
      >
        <TouchableOpacity
          style={styles.sheetRow}
          onPress={() => {
            setActionSheetVisible(false);
            navigation.navigate('ItemTabs', { screen: 'Items' });
          }}
        >
          <Ionicons
            name="shirt-outline"
            size={20}
            color={colors.primary}
            style={styles.sheetIcon}
          />
          <Text style={styles.sheetText}>Browse items to add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sheetRow, itemCount === 0 && styles.sheetRowDisabled]}
          disabled={itemCount === 0}
          onPress={() => {
            setActionSheetVisible(false);
            setIsRemovingItems(true);
          }}
        >
          <Ionicons
            name="close-outline"
            size={20}
            color={itemCount === 0 ? colors.gray : colors.primary}
            style={styles.sheetIcon}
          />
          <Text style={[styles.sheetText, itemCount === 0 && styles.sheetTextDisabled]}>
            Remove items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sheetRow}
          onPress={() => {
            setActionSheetVisible(false);
            setModalVisible(true);
          }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.red} style={styles.sheetIcon} />
          <Text style={styles.deleteText}>Delete collection</Text>
        </TouchableOpacity>
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
    innerContainer: {
      flex: 1,
      paddingTop: 2,
    },
    topbar: {
      width: '100%',
      backgroundColor: colors.primaryDark,
      gap: 6,
      paddingTop: 10,
      paddingBottom: 13,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topbarButton: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topbarTitle: {
      flex: 1,
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginHorizontal: 12,
    },
    actionBar: {
      backgroundColor: colors.white,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 2,
    },
    itemCountText: {
      color: colors.gray,
      fontSize: 14,
      fontWeight: '500',
    },
    wearButton: {
      minWidth: 70,
      height: 32,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 4,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
    },
    wearButtonDisabled: {
      opacity: 0.6,
    },
    wearButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    doneButton: {
      minWidth: 70,
      height: 32,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: colors.primaryDark,
    },
    doneButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    removeItemButton: {
      width: 36,
      height: 36,
      marginLeft: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaPanel: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 2,
    },
    createdText: {
      color: colors.gray,
      fontSize: 13,
    },
    sectionTitle: {
      color: colors.gray,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 8,
      marginBottom: 2,
    },
    emptyState: {
      flex: 1,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingBottom: 80,
    },
    emptyIcon: {
      marginBottom: 14,
    },
    emptyTitle: {
      color: colors.black,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      color: colors.gray,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 18,
    },
    emptyButton: {
      minHeight: 42,
      borderRadius: 21,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryDark,
    },
    emptyButtonText: {
      color: 'white',
    },
    sheetRow: {
      width: '100%',
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sheetRowDisabled: {
      opacity: 0.5,
    },
    sheetIcon: {
      marginRight: 10,
    },
    sheetText: {
      color: colors.black,
      fontSize: 15,
      fontWeight: '500',
    },
    sheetTextDisabled: {
      color: colors.gray,
    },
    deleteText: {
      color: colors.red,
      fontSize: 15,
      fontWeight: '500',
    },
  });

export default CollectionDetailScreen;
