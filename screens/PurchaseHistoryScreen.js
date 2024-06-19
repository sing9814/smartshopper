import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import colors from '../utils/colors';
import { fetchPurchases, updatePurchaseWears } from '../utils/firebase';
import { formatDate } from '../utils/date';
import ConfirmationPopup from '../components/confirmationPopup';

const PurchaseHistoryScreen = () => {
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

  if (loading) {
    return <Text>Loading...</Text>;
  }

  const renderFooter = () => (
    <View style={{ padding: 8, alignItems: 'center' }}>
      <Text style={styles.description}>No more data to show</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {popups.map((popup, index) => (
        <ConfirmationPopup
          style={{ top: index * 56 }}
          key={popup.id}
          message={popup.message}
          index={index}
        />
      ))}
      {purchases.length > 0 ? (
        <FlatList
          data={purchases}
          contentContainerStyle={styles.list}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity onLongPress={() => incrementWears(item)} style={styles.container}>
              <View style={styles.imageContainer}>
                <Image
                  style={styles.image}
                  source={
                    item.brand?.image
                      ? {
                          uri: item.brand.image,
                        }
                      : require('../assets/bag.png')
                  }
                />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.priceContainer}>
                  <Text style={styles.item}>{item.name}</Text>
                  <Text style={styles.date}>
                    • {item.wears !== undefined ? item.wears + ' wears' : 'N/A wears'}
                  </Text>
                </View>
                <Text style={styles.description}>
                  {item.description ? item.description : '(no description)'}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <Text style={styles.date}>{formatDate(item.datePurchased)}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.paidPrice}>${item.paidPrice}</Text>
                  {item.paidPrice !== item.regularPrice && (
                    <Text style={styles.regularPrice}>${item.regularPrice}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={{ padding: 8, alignItems: 'center' }}>
          <Text style={styles.description}>No data to show</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 65,
    flexGrow: 0,
  },
  container: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 10,
    borderBottomColor: colors.bg,
    marginBottom: 2,
  },
  item: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 15,
  },
  description: {
    color: 'gray',
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 100,
    padding: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
    objectFit: 'contain',
  },
  textContainer: {
    justifyContent: 'center',
    gap: 4,
    marginLeft: 10,
  },
  rightContainer: {
    position: 'absolute',
    height: '100%',
    right: 0,
    marginRight: 16,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  priceContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  paidPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.green,
    marginRight: 2,
  },
  regularPrice: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  date: {
    fontSize: 13,
    color: '#adadad',
  },
});

export default PurchaseHistoryScreen;
