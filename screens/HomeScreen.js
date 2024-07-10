import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import colors from '../utils/colors';
import BottomOverlay from '../components/overlay';
import { fetchPurchases } from '../utils/firebase';
import Header from '../components/header';

const HomeScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const purchasesArray = await fetchPurchases();
    setPurchases(purchasesArray);
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

  return (
    <View style={styles.container}>
      <Header title={'Welcome Rita!'} rounded />

      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
});

export default HomeScreen;
