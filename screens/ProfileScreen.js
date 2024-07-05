import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../components/button';
import auth from '@react-native-firebase/auth';
import colors from '../utils/colors';
import WomanSVG from '../assets/womanSVG';
import PigSVG from '../assets/pigSVG';
import MoneySVG from '../assets/moneySVG';
import { fetchAccountDetails } from '../utils/firebase';
import Header from '../components/header';

const ProfileScreen = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    auth().signOut();
  };

  useEffect(() => {
    const fetchData = async () => {
      const accountDetails = await fetchAccountDetails();
      setUserDetails(accountDetails);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title={!loading && userDetails.name}
        subtitle={!loading && userDetails.email}
        rounded
        padding
      ></Header>
      <View style={styles.innerContainer}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.amount}>$205</Text>
            <MoneySVG></MoneySVG>
            <Text style={styles.title}>Spent</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.amount}>$36</Text>
            <PigSVG></PigSVG>
            <Text style={styles.title}>Saved</Text>
          </View>
        </View>
        <WomanSVG></WomanSVG>

        <CustomButton buttonStyle={styles.button} onPress={handleSignOut} title="Log out" />
      </View>
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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default ProfileScreen;
