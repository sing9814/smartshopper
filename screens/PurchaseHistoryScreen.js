import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { fetchPurchases, updatePurchaseWears } from '../utils/firebase';
import ConfirmationPopup from '../components/confirmationPopup';
import Header from '../components/header';
import PurchaseList from '../components/purchaseList';

const PurchaseHistoryScreen = ({ navigation }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [popups, setPopups] = useState([]);
  const [pressCounts, setPressCounts] = useState({});

  const timersRef = useRef({});

  const fetchData = async () => {
    const purchasesArray = await fetchPurchases();
    setPurchases(purchasesArray);
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

    setPurchases(updatedPurchases);

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
      <PurchaseList
        purchases={purchases}
        refreshing={refreshing}
        onRefresh={onRefresh}
        loading={loading}
        onItemPress={(item) => navigation.navigate('Details', { purchase: item })}
        onItemLongPress={incrementWears}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PurchaseHistoryScreen;
