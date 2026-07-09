import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useDispatch, useSelector } from 'react-redux';
import PurchaseList from '../components/purchaseList';
import { useStatusBar } from '../hooks/useStatusBar';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { setCollections, setPurchases } from '../redux/actions/purchaseActions';
import { deleteDoc, updateMultiplePurchaseWears } from '../utils/firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Banner from '../components/banner';
import ConfirmationModal from '../components/confirmationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [showMessage, setShowMessage] = useState(false);
  const [isAddingWears, setIsAddingWears] = useState(false);

  useEffect(() => {
    const checkDismissed = async () => {
      const dismissed = await AsyncStorage.getItem('messageDismissed');
      if (dismissed !== 'true') setShowMessage(true);
    };
    checkDismissed();
  }, []);

  const handleDismissTip = async () => {
    setShowMessage(false);
    await AsyncStorage.setItem('messageDismissed', 'true');
  };

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

  const itemsInCollection = purchases.filter((item) => collection.items.includes(item.key));
  const itemCount = itemsInCollection.length;
  const createdDate = formatTimeStampNoTime(collection.dateCreated);
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
      await deleteDoc('Collections', collection.id);

      const updated = collections.filter((c) => c.id !== collection.id);
      dispatch(setCollections(updated));

      setModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      showBanner('Failed to delete collection');
      setModalVisible(false);
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
        data={`"${collection.name}"`}
      />
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.topbarButton}
        >
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Collection</Text>
        <TouchableOpacity
          onPress={() => setActionSheetVisible(true)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.topbarButton}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.innerContainer}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="albums-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.heroText}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={2}>
                {collection.name}
              </Text>
              {itemCount > 0 && (
                <TouchableOpacity
                  style={[styles.wearButton, isAddingWears && styles.wearButtonDisabled]}
                  onPress={handleWearCollectionToday}
                  activeOpacity={0.8}
                  disabled={isAddingWears}
                  accessibilityRole="button"
                  accessibilityLabel={`Wear ${collection.name} today`}
                >
                  <Ionicons name="add-circle-outline" size={17} color={colors.primary} />
                  <Text style={styles.wearButtonText}>{isAddingWears ? 'Adding...' : 'Wear'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {createdDate && (
          <View style={styles.metaPanel}>
            <Text style={styles.createdText}>Created {createdDate}</Text>
          </View>
        )}

        {showMessage && itemCount === 0 && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Long press items on the "Items" tab to add them to this collection.
            </Text>
            <TouchableOpacity onPress={handleDismissTip}>
              <Ionicons name="close" size={18} color={colors.gray} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Items in this collection</Text>

        {itemCount > 0 ? (
          <PurchaseList
            purchases={itemsInCollection}
            loading={false}
            refreshing={false}
            navigation={navigation}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shirt-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No items here yet</Text>
            <Text style={styles.emptyText}>
              Add items from the Items tab to start building this collection.
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
        height={230}
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
      color: 'white',
      fontSize: 18,
    },
    hero: {
      backgroundColor: colors.white,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 18,
      marginBottom: 2,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroText: {
      flex: 1,
      gap: 5,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
    name: {
      flex: 1,
      fontSize: 22,
      fontWeight: '700',
      color: colors.black,
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
    messageContainer: {
      backgroundColor: colors.white,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    messageText: {
      color: colors.gray,
      flex: 1,
      paddingRight: 10,
      lineHeight: 22,
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
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
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
      lineHeight: 21,
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
    sheetIcon: {
      marginRight: 10,
    },
    sheetText: {
      color: colors.black,
      fontSize: 15,
      fontWeight: '500',
    },
    deleteText: {
      color: colors.red,
      fontSize: 15,
      fontWeight: '500',
    },
  });

export default CollectionDetailScreen;
