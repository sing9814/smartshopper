import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import PurchaseList from '../components/purchaseList';
import { useSelector, useDispatch } from 'react-redux';
import CustomInput from '../components/customInput';
import { useTheme } from '../theme/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ConfirmationModal from '../components/confirmationModal';
import { deleteDoc } from '../utils/firebase';
import { setPurchases } from '../redux/actions/purchaseActions';
import Banner from '../components/banner';
import { useStatusBar } from '../hooks/useStatusBar';
import BottomSheet from '../components/bottomSheet';
import CustomButton from '../components/button';
import { addItemsToCollections } from '../utils/firebase';
import { setCollections } from '../redux/actions/purchaseActions';

const ItemsScreen = ({ navigation, selectedItems, setSelectedItems }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primary);

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState([]);

  const purchases = useSelector((state) => state.purchase.purchases);
  const collections = useSelector((state) => state.purchase.collections);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState('');
  const [banner, setBanner] = useState(null);
  const [collectionSheetVisible, setCollectionSheetVisible] = useState(false);

  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  const filteredPurchases = purchases.filter((purchase) =>
    purchase.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {selectedItems.length > 0 && (
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
      )}

      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}

      <ConfirmationModal
        data={modalData}
        visible={modalVisible}
        onConfirm={handleDelete}
        onCancel={() => setModalVisible(false)}
      />

      <View style={styles.searchContainer}>
        <CustomInput
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          type="default"
          editable={true}
        />
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.count}>Results</Text>
        <Text style={styles.count}>{filteredPurchases.length} found</Text>
      </View>

      {!loading && filteredPurchases.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.emptyText}>No purchases found. Pull down to refresh.</Text>
        </ScrollView>
      ) : (
        <PurchaseList
          purchases={filteredPurchases}
          refreshing={refreshing}
          onRefresh={onRefresh}
          loading={loading}
          navigation={navigation}
          onItemLongPress={handleItemLongPress}
          selectedItems={selectedItems}
        />
      )}
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
                <View>
                  <View style={styles.row}>
                    <Text style={styles.sheetRowName}>{collection.name}</Text>
                    <Text style={styles.sheetRowDesc}>
                      ({collection.items.length} {collection.items.length !== 1 ? 'items' : 'item'})
                    </Text>
                  </View>
                  <Text style={styles.sheetRowDesc}>
                    {collection.description ? collection.description : '(No description)'}
                  </Text>
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
          title="Add to selected collections"
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
    clearText: {
      color: 'white',
      fontSize: 14,
      textDecorationLine: 'underline',
    },
    searchContainer: {
      backgroundColor: colors.white,
      padding: 10,
      marginBottom: 4,
    },
    countContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 6,
    },
    count: {
      color: colors.gray,
      fontSize: 13,
    },
    scrollView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: colors.gray,
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
