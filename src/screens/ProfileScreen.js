import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import CustomButton from '../components/button';
import auth from '@react-native-firebase/auth';
import { useTheme, useToggleTheme, useIsDark } from '../theme/themeContext';
import WomanSVG from '../../assets/womanSVG';
import PigSVG from '../../assets/pigSVG';
import MoneySVG from '../../assets/moneySVG';
import Header from '../components/header';
import { useSelector } from 'react-redux';

const ProfileScreen = () => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const toggleTheme = useToggleTheme();
  const isDark = useIsDark();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);

  const purchaseData = useSelector((state) => state.purchase.purchases);
  const user = useSelector((state) => state.user.user);

  const fetchData = async () => {
    setLoading(true);

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
  }, [purchaseData]);

  return (
    <View style={styles.container}>
      <Header title={user?.name || ' '} subtitle={user?.email || ' '} rounded padding />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        // refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
          <View style={styles.toggleRow}>
            <Text style={[styles.label, { color: colors.black }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.lightGrey, true: colors.lightGrey }}
              thumbColor={isDark ? colors.primary : colors.gray}
            />
          </View>

          <WomanSVG />
          <CustomButton buttonStyle={styles.button} onPress={handleSignOut} title="Log out" />
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      height: '100%',
      width: '100%',
      backgroundColor: colors.bg,
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
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 12,
      marginTop: 24,
      backgroundColor: colors.white,
      padding: 10,
      borderRadius: 10,
    },
    label: {
      fontSize: 16,
      marginLeft: 10,
    },
  });

export default ProfileScreen;
