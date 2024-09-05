import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import { updatePurchaseWears } from '../utils/firebase';
import ConfirmationPopup from '../components/confirmationPopup';
import Header from '../components/header';
import PurchaseList from '../components/purchaseList';
import { useSelector, useDispatch } from 'react-redux';
import { setPurchases } from '../redux/actions/purchaseActions';

const PurchaseHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [popups, setPopups] = useState([]);
  const [pressCounts, setPressCounts] = useState({});

  const timersRef = useRef({});

  const purchases = useSelector((state) => state.purchase.purchases);

  const fetchData = async () => {
    // const purchasesArray = await fetchPurchases();
    setLoading(false);
    setRefreshing(false);
  };

  const showPopup = (item, newWearCount) => {
    setPopups((prevPopups) => {
      const existingPopup = prevPopups.find((popup) => popup.id === item.key);

      if (existingPopup) {
        clearTimeout(timersRef.current[item.key]);
      }

      const newTimer = setTimeout(() => {
        setPopups((currentPopups) => currentPopups.filter((popup) => popup.id !== item.key));
        delete timersRef.current[item.key];
        setPressCounts((prevCounts) => ({ ...prevCounts, [item.key]: 0 }));
      }, 2000);

      timersRef.current[item.key] = newTimer;

      if (existingPopup) {
        return prevPopups.map((popup) =>
          popup.id === item.key
            ? { ...popup, message: `${newWearCount} wears added to ${item.name}` }
            : popup
        );
      }

      return [
        ...prevPopups,
        { id: item.key, message: `${newWearCount} wear added to ${item.name}` },
      ];
    });
  };

  useEffect(() => {
    fetchData();
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const incrementWears = async (item) => {
    const newPressCount = (pressCounts[item.key] || 0) + 1;
    setPressCounts({ ...pressCounts, [item.key]: newPressCount });

    const newWears = (item.wears || 0) + 1;

    const updatedPurchases = purchases.map((purchase) =>
      purchase.key === item.key ? { ...purchase, wears: newWears } : purchase
    );

    dispatch(setPurchases(updatedPurchases));
    await updatePurchaseWears(item.key, newWears);
    showPopup(item, newPressCount);
  };

  return (
    <View style={styles.container}>
      <Header title={'History'} />
      {popups.map((popup, index) => (
        <ConfirmationPopup
          style={{ top: index * 56 }}
          key={popup.id}
          message={popup.message}
          index={index}
        />
      ))}
      {!loading && purchases.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.emptyText}>No purchases found. Pull down to refresh.</Text>
        </ScrollView>
      ) : (
        <PurchaseList
          purchases={purchases}
          refreshing={refreshing}
          onRefresh={onRefresh}
          loading={loading}
          onItemLongPress={incrementWears}
          navigation={navigation}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: 'gray',
  },
});

export default PurchaseHistoryScreen;
