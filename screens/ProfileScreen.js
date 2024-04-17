import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../components/button';
import auth from '@react-native-firebase/auth';
import colors from '../utils/colors';
import WomanSVG from '../assets/womanSVG';
import PigSVG from '../assets/pigSVG';
import MoneySVG from '../assets/moneySVG';

const ProfileScreen = () => {
  const handleSignOut = async () => {
    auth().signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.name}>Rita</Text>
        <Text style={styles.email}>{auth().currentUser.email}</Text>
      </View>
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
  topbar: {
    width: '100%',
    backgroundColor: colors.primary,
    gap: 6,
    padding: 30,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.white,
    // letterSpacing: 0.5,
  },
  innerContainer: {
    width: '100%',
    paddingHorizontal: 16,
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
