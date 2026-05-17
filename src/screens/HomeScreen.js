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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getWearLevelData } from '../utils/wears';

const getWearDate = (wear) => {
  if (!wear) return null;
  if (wear.seconds) return new Date(wear.seconds * 1000);

  const date = new Date(wear);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLastWearDate = (item) => {
  const wears = item.wears || [];
  return getWearDate(wears[wears.length - 1]);
};

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

  const [name, setName] = useState('');

  const purchases = useSelector((state) => state.purchase.purchases);
  const user = useSelector((state) => state.user.user);

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

  const wearStats = useMemo(() => {
    const totalItems = purchases.length;
    const totalWears = purchases.reduce((total, item) => total + (item.wears?.length || 0), 0);
    const wornItems = purchases.filter((item) => (item.wears?.length || 0) > 0).length;
    const mostWorn = purchases.reduce((topItem, item) => {
      if (!topItem) return item;

      return (item.wears?.length || 0) > (topItem.wears?.length || 0) ? item : topItem;
    }, null);
    const leastWorn =
      purchases.length > 1
        ? [...purchases]
            .filter((item) => item.key !== mostWorn?.key)
            .sort((a, b) => {
              const wearDifference = (a.wears?.length || 0) - (b.wears?.length || 0);
              if (wearDifference !== 0) return wearDifference;

              const aLastWorn = getLastWearDate(a)?.getTime() || 0;
              const bLastWorn = getLastWearDate(b)?.getTime() || 0;

              return aLastWorn - bLastWorn;
            })[0]
        : null;

    return {
      totalItems,
      totalWears,
      wornItems,
      mostWorn,
      leastWorn,
    };
  }, [purchases]);

  const mostWornCount = wearStats.mostWorn?.wears?.length || 0;
  const leastWornCount = wearStats.leastWorn?.wears?.length || 0;

  return (
    <View style={styles.container}>
      <Header title={loading ? ' ' : `Overview`} />

      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!loading && (
          <>
            <View style={styles.totalWearsCard}>
              <View style={styles.totalWearsIcon}>
                <Ionicons name="repeat-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.analyticsValue}>{wearStats.totalWears}</Text>
              <Text style={styles.analyticsSubtext}>Total wears</Text>
            </View>

            <View style={styles.analyticsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Item insights</Text>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.coverageRow}>
                <View style={styles.coverageIcon}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.coverageText}>
                  {wearStats.totalItems
                    ? `${wearStats.wornItems} of ${wearStats.totalItems} items have been worn`
                    : 'Add items to start seeing trends'}
                </Text>
              </View>
              {wearStats.mostWorn ? (
                <>
                  <ItemInsight
                    title="Most worn"
                    icon="trending-up-outline"
                    item={wearStats.mostWorn}
                    wearCount={mostWornCount}
                    colors={colors}
                    styles={styles}
                  />
                  <View style={styles.divider} />
                  <ItemInsight
                    title="Least worn"
                    icon="trending-down-outline"
                    item={wearStats.leastWorn}
                    wearCount={leastWornCount}
                    colors={colors}
                    styles={styles}
                  />
                </>
              ) : (
                <Text style={styles.mutedText}>No items yet.</Text>
              )}
            </View>
          </>
        )}

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
        onClose={() => {
          setOpen(false);
          setName('');
        }}
        height={'50%'}
      >
        <View style={styles.sheetContainer}>
          {/* <Text style={styles.sheetText}>{selectedDate ? formatDate(selectedDate) : ''}</Text> */}
          <CustomInput
            label="Add item"
            value={name}
            onChangeText={setName}
            component={
              <AddButton
                onPress={() => [
                  navigation.navigate('Add', {
                    name: name === '' ? null : name,
                    date: selectedDate,
                  }),
                  setName(''),
                ]}
              />
            }
          />
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

const ItemInsight = ({ title, icon, item, wearCount, colors, styles }) => {
  if (!item) {
    return (
      <View>
        <Text style={styles.insightLabel}>{title}</Text>
        <Text style={styles.mutedText}>Not enough items yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.highlightRow}>
      <View style={styles.insightIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.highlightText}>
        <Text style={styles.insightLabel}>{title}</Text>
        <Text style={styles.highlightTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.mutedText}>{getWearLevelData(wearCount).label}</Text>
      </View>
      <Text style={styles.highlightValue}>{wearCount} wears</Text>
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
      paddingTop: 10,
      paddingBottom: 78,
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
      marginBottom: 10,
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
    analyticsCard: {
      backgroundColor: colors.white,
      marginHorizontal: 12,
      marginBottom: 10,
      borderRadius: 10,
      padding: 14,
      gap: 12,
      elevation: 1,
    },
    totalWearsCard: {
      backgroundColor: colors.white,
      marginHorizontal: 12,
      marginBottom: 10,
      borderRadius: 10,
      padding: 18,
      elevation: 1,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    totalWearsIcon: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
    },
    analyticsValue: {
      color: colors.black,
      fontSize: 38,
      fontWeight: '700',
      lineHeight: 44,
    },
    analyticsSubtext: {
      color: colors.gray,
      marginTop: 2,
      fontSize: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '700',
    },
    coverageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.white,
      elevation: 2,
      marginBottom: 4,
    },
    coverageIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
    },
    coverageText: {
      flex: 1,
      color: colors.black,
      fontSize: 14,
      fontWeight: '500',
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    insightIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
    },
    highlightText: {
      flex: 1,
    },
    highlightTitle: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    insightLabel: {
      color: colors.gray,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    highlightValue: {
      color: colors.gray,
    },
    divider: {
      height: 1,
      backgroundColor: colors.bg,
    },
    mutedText: {
      color: colors.gray,
      fontSize: 13,
    },
  });

export default HomeScreen;
