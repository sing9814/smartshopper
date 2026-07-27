import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useDispatch, useSelector } from 'react-redux';
import PurchaseList from '../components/purchaseList';
import { useStatusBar } from '../hooks/useStatusBar';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { setCollections, setPurchases } from '../redux/actions/purchaseActions';
import { deleteDoc, removeItemsFromCollection } from '../utils/firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Banner from '../components/banner';
import ConfirmationModal from '../components/confirmationModal';
import BottomSheet from '../components/bottomSheet';
import CustomButton from '../components/button';
import DatePicker from 'react-native-date-picker';
import { formatTimeStampNoTime, getDeviceTimeZone } from '../utils/date';
import { addWearToCollectionDate } from '../utils/collectionWears';

const CollectionDetailScreen = ({ route, navigation }) => {
  const { collection } = route.params;
  const colors = useTheme();
  const styles = createStyles(colors);

  const [banner, setBanner] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [isAddingWears, setIsAddingWears] = useState(false);
  const [isWearDatePickerOpen, setIsWearDatePickerOpen] = useState(false);
  const [selectedWearDate, setSelectedWearDate] = useState(new Date());
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

  const handleWearCollection = async (wearDate) => {
    if (isAddingWears || itemCount === 0) return;

    setIsAddingWears(true);

    try {
      const result = await addWearToCollectionDate({
        collection: currentCollection,
        purchases,
        timeZone,
        wearDate,
      });
      if (result.didUpdate) dispatch(setPurchases(result.updatedPurchases));
      if (result.message) showBanner(result.message, 'success');
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
      <DatePicker
        modal
        open={isWearDatePickerOpen}
        date={selectedWearDate}
        maximumDate={new Date()}
        mode="date"
        title={`When did you wear ${currentCollection.name}?`}
        confirmText="Add wears"
        onConfirm={(date) => {
          setIsWearDatePickerOpen(false);
          setSelectedWearDate(date);
          handleWearCollection(date);
        }}
        onCancel={() => setIsWearDatePickerOpen(false)}
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
          Collection
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
        <View
          style={[
            styles.collectionHeader,
            (isRemovingItems || itemCount === 0) && styles.collectionHeaderCompact,
          ]}
        >
          <View
            style={[
              styles.actionBar,
              !isRemovingItems && itemCount > 0 && styles.actionBarWithDivider,
            ]}
          >
            <Text style={styles.collectionName} numberOfLines={1}>
              {currentCollection.name}
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
              createdDate && <Text style={styles.createdText}>Created {createdDate}</Text>
            )}
          </View>
          {!isRemovingItems && itemCount > 0 && (
            <CustomButton
              title={isAddingWears ? 'Adding...' : 'Add wears'}
              onPress={() => {
                setSelectedWearDate(new Date());
                setIsWearDatePickerOpen(true);
              }}
              disabled={isAddingWears}
            />
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>In this collection</Text>
          <Text style={styles.sectionTitle}>
            {itemCount} {itemCount !== 1 ? 'items' : 'item'}
          </Text>
        </View>

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
            <Text style={styles.emptyTitle}>No items here yet</Text>
            <Text style={styles.emptyText}>Choose items to add to this collection.</Text>
            <CustomButton
              title="Browse items"
              onPress={() =>
                navigation.navigate('AddItemsToCollection', {
                  addToCollectionId: currentCollection.id,
                  addToCollectionName: currentCollection.name,
                })
              }
            />
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
            navigation.navigate('AddItemsToCollection', {
              addToCollectionId: currentCollection.id,
              addToCollectionName: currentCollection.name,
            });
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
      textAlign: 'center',
      marginHorizontal: 12,
    },
    actionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      gap: 12,
    },
    actionBarWithDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
      marginBottom: 12,
    },
    collectionHeader: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingBottom: 12,
      marginBottom: 2,
    },
    collectionHeaderCompact: {
      paddingBottom: 0,
    },
    collectionName: {
      flex: 1,
      color: colors.black,
      fontSize: 20,
      fontWeight: '600',
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
    createdText: {
      color: colors.gray,
      fontSize: 13,
      flexShrink: 0,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 8,
      marginBottom: 2,
    },
    sectionTitle: {
      color: colors.gray,
      fontSize: 13,
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
      marginBottom: 12,
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
