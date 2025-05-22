import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import Header from '../components/header';
import PurchaseList from '../components/purchaseList';
import { useSelector, useDispatch } from 'react-redux';
import CustomInput from '../components/customInput';
import { useTheme } from '../theme/themeContext';

const PurchaseHistoryScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const purchases = useSelector((state) => state.purchase.purchases);

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

  const clearSelection = () => setSelectedItems([]);

  return (
    <View style={styles.container}>
      {selectedItems.length > 0 ? (
        <View style={[styles.selectionHeader, styles.headerContainer]}>
          <Text style={styles.headerTitle}>{`${selectedItems.length} selected`}</Text>
          <Text style={styles.clearText} onPress={clearSelection}>
            Clear
          </Text>
        </View>
      ) : (
        <Header title={'Items'} />
      )}

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
