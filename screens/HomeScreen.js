import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useState, useEffect } from 'react';
import colors from '../utils/colors';
import BottomOverlay from '../components/overlay';
import { fetchPurchases } from '../utils/firebase';

const HomeScreen = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const purchasesArray = await fetchPurchases();
      setPurchases(purchasesArray);
      setLoading(false);
    };
    fetchData();

    return () => {};
  }, []);

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
      <View style={styles.topbar}>
        <Text style={styles.name}>Welcome Rita!</Text>
        {/* <Text style={styles.email}>w</Text> */}
      </View>

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
          // today: '2024-05-15',
        }}
        style={styles.calendar}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={getMarkedDates()}
      />
      <BottomOverlay
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        list={
          selectedDate ? purchases.filter((product) => product.datePurchased === selectedDate) : []
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topbar: {
    width: '100%',
    backgroundColor: colors.primary,
    gap: 6,
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.white,
  },
  email: {
    color: colors.white,
  },
  container: {
    flex: 1,
  },
  calendar: {
    marginHorizontal: 12,
    borderRadius: 10,
  },
});

export default HomeScreen;
