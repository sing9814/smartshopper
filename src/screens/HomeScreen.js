import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { fetchAllUserData, fetchMergedCategories } from '../utils/firebase';
import Header from '../components/header';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases, setCollections } from '../redux/actions/purchaseActions';
import { setUser } from '../redux/actions/userActions';
import { setCategories, setCustomCategories } from '../redux/actions/userActions';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import BottomSheet from '../components/bottomSheet';
import CustomInput from '../components/customInput';
import AddButton from '../components/addButton';
import { formatDate } from '../utils/date';
import PurchaseList from '../components/purchaseList';
import { categories as defaultCategories } from '../../assets/json/categories';
import { useTheme } from '../theme/themeContext';
import { convertCentsToDollars } from '../utils/price';
import { useStatusBar } from '../hooks/useStatusBar';

const HomeScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primary);

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
    const { userData, purchaseData, collectionData } = await fetchAllUserData();
    const { merged, customCategories } = await fetchMergedCategories(defaultCategories);
    dispatch(setUser(userData));
    dispatch(setPurchases(purchaseData));
    dispatch(setCollections(collectionData));
    dispatch(setCategories(merged));
    dispatch(setCustomCategories(customCategories));
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

  const formatDollar = (amount) => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercent = () => {
    let amount = (parseFloat(convertCentsToDollars(totalRegularPrice)) / user?.budget) * 100;
    if (amount > 100) {
      return '>100';
    }
    return amount.toFixed(0);
  };

  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);

  const totalRegularPrice = useMemo(() => {
    return purchases.reduce((total, purchase) => {
      const purchaseDate = new Date(purchase.datePurchased);
      const purchaseYear = purchaseDate.getFullYear();
      const purchaseMonth = purchaseDate.getUTCMonth() + 1;

      if (purchaseYear === currentYear && purchaseMonth === currentMonth) {
        return total + parseFloat(purchase.paidPrice || purchase.regularPrice);
      }

      return total;
    }, 0);
  }, [purchases, currentMonth, currentYear]);

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
                fill={(convertCentsToDollars(totalRegularPrice) / user?.budget) * 100}
                tintColor={'#51fa05'}
                backgroundColor="#e0e0e0"
                rotation={230}
                lineCap="round"
                arcSweepAngle={260}
                tintColorSecondary={'#f03702'}
              >
                {() => <Text style={styles.labelProgress}>{formatPercent()}%</Text>}
              </AnimatedCircularProgress>
              <Text style={styles.subLabel}>
                {formatDollar(convertCentsToDollars(totalRegularPrice))} of your{' '}
                {formatDollar(user?.budget)} budget used
              </Text>
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
            onMonthChange={(month) => {
              setCurrentMonth(month.month);
              setCurrentYear(month.year);
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
                  onPress={() => [
                    navigation.navigate('Add', { name: name, date: selectedDate }),
                    setName(''),
                  ]}
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
      flex: 1,
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
      flex: 1,
      width: '100%',
      paddingBottom: 40,
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
      elevation: 1,
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
      elevation: 1,
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
