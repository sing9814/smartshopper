import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import Header from '../components/header';
import PurchaseList from '../components/purchaseList';
import { useSelector, useDispatch } from 'react-redux';
import CustomInput from '../components/customInput';
import { useTheme } from '../theme/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ConfirmationModal from '../components/confirmationModal';
import { deleteDoc } from '../utils/firebase';
import { setPurchases } from '../redux/actions/purchaseActions';
import Banner from '../components/banner';

const PurchaseHistoryScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const purchases = useSelector((state) => state.purchase.purchases);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState('');
  const [banner, setBanner] = useState(null);

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
            <Ionicons name="close" size={22} color="white" onPress={clearSelection} />
            <Text style={styles.headerTitle}>{`${selectedItems.length} selected`}</Text>
          </View>
          <Ionicons
            name="trash-outline"
            size={22}
            color="white"
            onPress={selectedItems.length > 0 ? handleTrashPress : () => {}}
          />
        </View>
      ) : (
        <Header title={'Items'} />
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
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
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
  });

export default PurchaseHistoryScreen;
