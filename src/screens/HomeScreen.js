import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { fetchUserDataAndPurchases, fetchMergedCategories } from '../utils/firebase';
import Header from '../components/header';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases } from '../redux/actions/purchaseActions';
import { setUser } from '../redux/actions/userActions';
import { setCategories } from '../redux/actions/userActions';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import BottomSheet from '../components/bottomSheet';
import CustomInput from '../components/customInput';
import AddButton from '../components/addButton';
import { formatDate } from '../utils/date';
import PurchaseList from '../components/purchaseList';
import { categories as defaultCategories } from '../../assets/json/categories';
import { useTheme } from '../theme/themeContext';

const HomeScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.black,
      calendarBackground: colors.white,
      textSectionTitleColor: colors.textSectionTitleColor,
      selectedDayBackgroundColor: colors.lightGrey,
      selectedDayTextColor: colors.white,
      todayTextColor: 'white',
      dayTextColor: colors.dayTextColor,
      textDisabledColor: colors.textDisabledColor,
      arrowColor: colors.black,
      todayBackgroundColor: colors.primary,
      todayDotColor: colors.white,
      dotColor: colors.primary,
      textMonthFontSize: 17,
      textMonthFontWeight: 'bold',
      monthTextColor: colors.black,
    }),
    [colors]
  );

  const [open, setOpen] = useState(false);

  const dispatch = useDispatch();

  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState(false);

  const purchases = useSelector((state) => state.purchase.purchases);
  const user = useSelector((state) => state.user.user);
  const users = useSelector((state) => state.user.categories);

  const fetchData = async () => {
    const { userData, purchaseData } = await fetchUserDataAndPurchases();
    const merged = await fetchMergedCategories(defaultCategories);
    dispatch(setUser(userData));
    dispatch(setPurchases(purchaseData));
    dispatch(setCategories(merged));
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
    const purchaseMonth = purchaseDate.getUTCMonth() + 1;

    if (purchaseYear === currentYear && purchaseMonth === currentMonth) {
      return total + parseFloat(purchase.regularPrice);
    }

    return total;
  }, 0);

  return (
    <View style={styles.container}>
      <Header title={loading ? ' ' : `Overview`} />

      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.progress}>
          {!loading && (
            <>
              <Text style={styles.label}>{`Your spending`}</Text>
              <AnimatedCircularProgress
                size={100}
                width={17}
                fill={(totalRegularPrice / user?.budget) * 100}
                tintColor={'#51fa05'}
                backgroundColor="#e0e0e0"
                rotation={230}
                lineCap="round"
                arcSweepAngle={260}
                tintColorSecondary={'#f03702'}
              >
                {() => (
                  <Text style={styles.labelProgress}>
                    {(totalRegularPrice / user?.budget) * 100}
                  </Text>
                )}
              </AnimatedCircularProgress>
              <Text style={styles.subLabel}>{`$${
                (totalRegularPrice / user?.budget) * 100
              } of your $${user?.budget} budget used`}</Text>
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
            key={colors.mode}
            theme={calendarTheme}
            style={styles.calendar}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setOpen(true);
            }}
            markedDates={getMarkedDates()}
          />
        )}
      </ScrollView>

      <BottomSheet
        title={selectedDate ? formatDate(selectedDate) : ''}
        visible={open}
        onClose={() => setOpen(false)}
        height={'50%'}
      >
        <View style={styles.sheetContainer}>
          {/* <Text style={styles.sheetText}>{selectedDate ? formatDate(selectedDate) : ''}</Text> */}
          <View style={styles.input}>
            <CustomInput
              label="Add item"
              value={name}
              onChangeText={setName}
              component={
                <AddButton
                  onPress={() => [navigation.navigate('Add', { name: name }), setName('')]}
                  size={20}
                />
              }
            />
          </View>
          <View style={styles.list}>
            <PurchaseList
              purchases={
                selectedDate
                  ? purchases.filter((product) => product.datePurchased === selectedDate)
                  : []
              }
              overlay
              navigation={navigation}
              onItemLongPress={() => {}}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    sheetContainer: {
      width: '100%',
      gap: 8,
    },
    sheetText: {
      alignSelf: 'center',
      color: colors.gray,
    },
    input: {
      marginBottom: 12,
    },
    list: {
      width: '100%',
      height: '100%',
    },
    box: {
      width: 100,
      height: 100,
      backgroundColor: 'tomato',
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollView: {
      flexGrow: 1,
    },
    calendar: {
      marginHorizontal: 12,
      borderRadius: 10,
      elevation: 2,
      paddingBottom: 6,
    },
    title: {
      color: 'black',
      fontSize: 20,
      fontWeight: '500',
      marginBottom: 12,
    },
    progress: {
      backgroundColor: colors.white,
      marginHorizontal: 12,
      borderRadius: 10,
      margin: 10,
      // paddingHorizontal: 20,
      paddingVertical: 16,
      elevation: 2,
      alignItems: 'center',
    },
    label: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.black,
      marginBottom: 16,
    },
    labelProgress: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.black,
    },
    subLabel: {
      fontSize: 14,
      color: 'grey',
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
