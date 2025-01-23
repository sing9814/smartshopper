import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import colors from '../utils/colors';
import BottomOverlay from '../components/overlay';
import { fetchUserDataAndPurchases } from '../utils/firebase';
import Header from '../components/header';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases } from '../redux/actions/purchaseActions';
import { setUser } from '../redux/actions/userActions';
import ProgressBar from '../components/progressBar';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const purchases = useSelector((state) => state.purchase.purchases);
  const user = useSelector((state) => state.user.user);

  const fetchData = async () => {
    const { userData, purchaseData } = await fetchUserDataAndPurchases();
    dispatch(setUser(userData));
    dispatch(setPurchases(purchaseData));
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

  const getMarkedDates = () => {
    if (!loading) {
      const markedDates = {};
      if (selectedDate) {
        markedDates[selectedDate] = {
          selected: true,
        };
      }
      purchases.forEach((item) => {
        if (!markedDates[item.datePurchased]) {
          markedDates[item.datePurchased] = { marked: true };
        }
      });
      return markedDates;
    }
  };

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const totalRegularPrice = purchases.reduce((total, purchase) => {
    const purchaseDate = new Date(purchase.datePurchased);
    const purchaseYear = purchaseDate.getFullYear();
    const purchaseMonth = purchaseDate.getMonth() + 1;

    if (purchaseYear === currentYear && purchaseMonth === currentMonth) {
      return total + parseFloat(purchase.regularPrice);
    }

    return total;
  }, 0);

  return (
    <View style={styles.container}>
      <Header title={loading ? ' ' : `Welcome ${user.name}!`} rounded />

      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.progress}>
          {!loading && (
            <>
              <Text style={styles.title}>Monthly Budget (${user?.budget})</Text>
              <ProgressBar budget={user?.budget} spent={totalRegularPrice} />
            </>
          )}
        </View>
        {loading ? (
          <View>
            <View style={styles.placeholder}></View>
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loadingIndicator}
            />
          </View>
        ) : (
          <Calendar
            theme={{
              backgroundColor: '#000',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: colors.lightGrey,
              selectedDayTextColor: '#ffffff',
              todayTextColor: colors.white,
              dayTextColor: '#2d4150',
              textDisabledColor: '#a1a1a1',
              arrowColor: colors.black,
              todayBackgroundColor: colors.primary,
              todayDotColor: colors.white,
              dotColor: colors.primary,
            }}
            style={styles.calendar}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
            }}
            markedDates={getMarkedDates()}
          />
        )}
      </ScrollView>
      <BottomOverlay
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        navigation={navigation}
        list={
          selectedDate ? purchases.filter((product) => product.datePurchased === selectedDate) : []
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  calendar: {
    marginHorizontal: 12,
    borderRadius: 10,
  },
  title: {
    color: 'black',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  progress: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    borderRadius: 10,
    margin: 10,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  placeholder: {
    left: 0,
    right: 0,
    marginHorizontal: 12,
    borderRadius: 10,
    height: 250,
    backgroundColor: colors.white,
  },
  loadingIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 10,
  },
});

export default HomeScreen;
