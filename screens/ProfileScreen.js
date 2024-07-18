import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import CustomButton from '../components/button';
import auth from '@react-native-firebase/auth';
import colors from '../utils/colors';
import WomanSVG from '../assets/womanSVG';
import PigSVG from '../assets/pigSVG';
import MoneySVG from '../assets/moneySVG';
import { fetchUserDataAndPurchases } from '../utils/firebase';
import Header from '../components/header';

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const { userData, purchaseData } = await fetchUserDataAndPurchases();
    setUser(userData);

    let spent = 0;
    let saved = 0;

    purchaseData.forEach((purchase) => {
      const regularPrice = parseFloat(purchase.regularPrice) || 0;
      const paidPrice = parseFloat(purchase.paidPrice) || regularPrice;
      spent += paidPrice;
      saved += regularPrice - paidPrice;
    });

    setTotalSpent(spent);
    setTotalSaved(saved);

    setLoading(false);
  };

  const handleSignOut = async () => {
    auth().signOut();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Header title={user?.name || ' '} subtitle={user?.email || ' '} rounded padding />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.innerContainer}>
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.amount}>${totalSpent.toFixed(2)}</Text>
              <MoneySVG />
              <Text style={styles.title}>Spent</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.amount}>${totalSaved.toFixed(2)}</Text>
              <PigSVG />
              <Text style={styles.title}>Saved</Text>
            </View>
          </View>
          <WomanSVG />
          <CustomButton buttonStyle={styles.button} onPress={handleSignOut} title="Log out" />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    paddingHorizontal: 12,
    flex: 1,
  },
  button: {
    bottom: 75,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 50,
    paddingVertical: 16,
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  amount: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: colors.black,
    fontSize: 16,
  },
  cardContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default ProfileScreen;
