import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
import OptionsSheet from '../components/optionsSheet';
import CustomButton from '../components/button';
import DatePicker from 'react-native-date-picker';
import { formatDate, formatDateWithWeekday, getDeviceTimeZone } from '../utils/date';
import { addWearToCollectionDate } from '../utils/collectionWears';
import { getCollectionFolderBackground, getCollectionFolderColor } from '../utils/collectionColor';

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
  const [activeTab, setActiveTab] = useState('items');

  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  const returnToCollections = () => {
    navigation.navigate('ItemTabs', { screen: 'Collections' });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      returnToCollections();
    }
  };

  useStatusBar(colors.primaryDark);

  const dispatch = useDispatch();
  const collections = useSelector((state) => state.purchase.collections);
  const purchases = useSelector((state) => state.purchase.purchases);

  const currentCollection = collections.find((item) => item.id === collection.id) || collection;
  const collectionItemIds = currentCollection.items || [];
  const itemsInCollection = purchases.filter((item) => collectionItemIds.includes(item.key));
  const itemCount = itemsInCollection.length;
  const timeZone = getDeviceTimeZone();
  const wearHistory = currentCollection.wearHistory || [];
  const lastWear = wearHistory[wearHistory.length - 1];
  const wearHistoryNewestFirst = [...wearHistory].reverse();
  const folderColor = getCollectionFolderColor(currentCollection.folderColor, colors);

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
      if (result.updatedCollection) {
        dispatch(
          setCollections(
            collections.map((savedCollection) =>
              savedCollection.id === result.updatedCollection.id
                ? result.updatedCollection
                : savedCollection
            )
          )
        );
      }
      if (result.message) showBanner(result.message, 'success');
    } catch (error) {
      console.error('Failed to wear outfit:', error);
      showBanner('Failed to add wear for this outfit');
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
      returnToCollections();
    } catch (error) {
      console.error('Failed to delete outfit:', error);
      showBanner('Failed to delete outfit');
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
        title="Delete outfit"
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
        title={`Add wear`}
        confirmText="Submit"
        onConfirm={(date) => {
          setIsWearDatePickerOpen(false);
          setSelectedWearDate(date);
          handleWearCollection(date);
        }}
        onCancel={() => setIsWearDatePickerOpen(false)}
      />
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.topbarButton}
        >
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>
          Outfit
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
            <View
              style={[
                styles.folderIcon,
                {
                  backgroundColor: getCollectionFolderBackground(
                    currentCollection.folderColor,
                    colors
                  ),
                },
              ]}
            >
              <Ionicons name="folder-outline" size={27} color={folderColor} />
            </View>
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName} numberOfLines={1}>
                {currentCollection.name}
              </Text>
              {!isRemovingItems && (
                <Text style={styles.lastWornText}>
                  {lastWear ? `Last worn ${formatDate(lastWear.date)}` : 'Never worn'}
                </Text>
              )}
            </View>
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
            ) : null}
          </View>
          {!isRemovingItems && itemCount > 0 && (
            <CustomButton
              title={isAddingWears ? 'Adding...' : 'Add wear'}
              onPress={() => {
                setSelectedWearDate(new Date());
                setIsWearDatePickerOpen(true);
              }}
              disabled={isAddingWears}
            />
          )}
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'items' && styles.activeTab]}
            onPress={() => setActiveTab('items')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'items' }}
          >
            <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
              In this outfit ({itemCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
            disabled={isRemovingItems}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'history', disabled: isRemovingItems }}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'items' ? (
          <>
            {itemCount > 0 ? (
              <PurchaseList
                purchases={itemsInCollection}
                loading={false}
                refreshing={false}
                navigation={navigation}
                disableItemPress={isRemovingItems}
                itemContainerStyle={styles.collectionItemRow}
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
                <Text style={styles.emptyText}>Choose items to add to this outfit.</Text>
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
          </>
        ) : wearHistoryNewestFirst.length > 0 ? (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {wearHistoryNewestFirst.map((event, index) => (
              <View key={`${formatDate(event.date)}-${index}`} style={styles.historyRow}>
                <Text style={styles.historyDate}>{formatDateWithWeekday(event.date)}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No wears logged yet</Text>
            <Text style={styles.emptyText}>Add wears to start tracking this outfit.</Text>
          </View>
        )}
      </View>

      <OptionsSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        options={[
          {
            label: 'Browse items to add',
            icon: <Ionicons name="shirt-outline" size={20} color={colors.primary} />,
            onPress: () =>
              navigation.navigate('AddItemsToCollection', {
                addToCollectionId: currentCollection.id,
                addToCollectionName: currentCollection.name,
              }),
          },
          ...(itemCount > 0
            ? [
                {
                  label: 'Remove items',
                  icon: <Ionicons name="close-outline" size={20} color={colors.primary} />,
                  onPress: () => {
                    setActiveTab('items');
                    setIsRemovingItems(true);
                  },
                },
              ]
            : []),
          {
            label: 'Delete outfit',
            icon: <Ionicons name="trash-outline" size={20} color={colors.red} />,
            destructive: true,
            onPress: () => setModalVisible(true),
          },
        ]}
      />
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
      color: colors.black,
      fontSize: 20,
      fontWeight: '600',
    },
    collectionInfo: {
      flex: 1,
      gap: 3,
    },
    lastWornText: {
      color: colors.gray,
      fontSize: 13,
    },
    folderIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
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
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 46,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      color: colors.gray,
      fontWeight: '500',
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    historyList: {
      flex: 1,
      backgroundColor: colors.white,
      paddingHorizontal: 20,
    },
    collectionItemRow: {
      paddingRight: 20,
      paddingLeft: 16,
    },
    historyRow: {
      height: 60,
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
    },
    historyDate: {
      color: colors.black,
      fontSize: 15,
      fontWeight: '500',
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
  });

export default CollectionDetailScreen;
