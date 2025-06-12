import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import CustomButton from '../components/button';
import auth from '@react-native-firebase/auth';
import { useTheme, useToggleTheme, useIsDark } from '../theme/themeContext';
import WomanSVG from '../../assets/womanSVG';
import PigSVG from '../../assets/pigSVG';
import MoneySVG from '../../assets/moneySVG';
import Header from '../components/header';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStatusBar } from '../hooks/useStatusBar';

const ProfileScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primary);
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
      const regularPrice = parseInt(purchase.regularPrice, 10) || 0;
      const paidPrice = parseInt(purchase.paidPrice, 10);

      spent += paidPrice;

      if (paidPrice < regularPrice) {
        saved += regularPrice - paidPrice;
      }
    });

    setTotalSpent((spent / 100).toFixed(2));
    setTotalSaved((saved / 100).toFixed(2));

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

      <View style={styles.innerContainer}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.amount}>${totalSpent}</Text>
            <MoneySVG />
            <Text style={styles.title}>Spent</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.amount}>${totalSaved}</Text>
            <PigSVG />
            <Text style={styles.title}>Saved</Text>
          </View>
        </View>

        <View style={styles.settings}>
          <Text style={styles.settingsText}>Settings</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('CustomCategory')}
          >
            <View style={styles.innerRowContainer}>
              <Ionicons
                name="folder-outline"
                size={24}
                color={colors.primary}
                style={styles.rowIcon}
              />
              <Text style={styles.title}>Manage categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.title}>Dark mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.lightGrey, true: colors.lightGrey }}
              thumbColor={isDark ? colors.primary : colors.gray}
            />
          </View>
        </View>
        <View style={styles.svgContainer}>
          <WomanSVG />
        </View>
        <CustomButton buttonStyle={styles.button} onPress={handleSignOut} title="Log out" />
      </View>
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
    settings: {
      marginTop: 6,
      marginHorizontal: 12,
      gap: 4,
    },
    settingsText: {
      color: colors.gray,
      marginBottom: 2,
    },
    button: {
      position: 'absolute',
      bottom: 75,
      alignSelf: 'center',
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
      elevation: 1,
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
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 10,
      elevation: 1,
      zIndex: 1,
    },
    innerRowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    rowIcon: {
      marginRight: 12,
    },
    svgContainer: {
      alignItems: 'center',
      position: 'absolute',
      bottom: 56,
      width: '100%',
    },
  });

export default ProfileScreen;
