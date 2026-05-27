import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { fetchAllUserData, fetchMergedCategories } from '../utils/firebase';
import Header from '../components/header';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases, setCollections } from '../redux/actions/purchaseActions';
import { setUser } from '../redux/actions/userActions';
import { setCategories, setCustomCategories } from '../redux/actions/userActions';
import BottomSheet from '../components/bottomSheet';
import {
  formatDate,
  getDateKeyInTimeZone,
  getDeviceTimeZone,
  timestampToDate,
} from '../utils/date';
import PurchaseList from '../components/purchaseList';
import { categories as defaultCategories } from '../../assets/json/categories';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getWearLevelData } from '../utils/wears';
import {
  USE_FAKE_DATA,
  createMockCategories,
  mockCollections,
  mockCustomCategories,
  mockPurchases,
  mockUserData,
} from '../utils/mockData';

const getLastWearDate = (item) => {
  const wears = item.wears || [];
  return timestampToDate(wears[wears.length - 1]);
};

const itemWasWornOnDate = (item, dateKey, timeZone) => {
  return (item.wears || []).some((wear) => {
    return getDateKeyInTimeZone(wear, timeZone) === dateKey;
  });
};

const getWearNumbersForDate = (item, dateKey, timeZone) => {
  return (item.wears || []).reduce((wearNumbers, wear, index) => {
    if (getDateKeyInTimeZone(wear, timeZone) === dateKey) {
      wearNumbers.push(index + 1);
    }

    return wearNumbers;
  }, []);
};

const getWearNumberText = (item, dateKey, timeZone) => {
  const wearNumbers = getWearNumbersForDate(item, dateKey, timeZone);
  const wears = item.wears || [];
  const latestWearNumber = wears.length;

  if (wearNumbers.length === 0) return '';
  if (wearNumbers.length === 1 && wearNumbers[0] === latestWearNumber) {
    return 'Most recent wear';
  }
  if (wearNumbers.length === 1) return `Wear #${wearNumbers[0]}`;

  if (wearNumbers.includes(latestWearNumber)) {
    const previousWearNumbers = wearNumbers.filter((wearNumber) => wearNumber !== latestWearNumber);
    return previousWearNumbers.length
      ? `Wears #${previousWearNumbers.join(', #')} + most recent`
      : 'Most recent wear';
  }

  return `Wears #${wearNumbers.join(', #')}`;
};

const HomeScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const timeZone = getDeviceTimeZone();
  useStatusBar(colors.primary);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.black,
      calendarBackground: colors.white,
      textSectionTitleColor: colors.textSectionTitleColor,
      selectedDayBackgroundColor: colors.lightGrey,
      selectedDayTextColor: colors.white,
      todayTextColor: colors.dayTextColor,
      dayTextColor: colors.dayTextColor,
      textDisabledColor: colors.textDisabledColor,
      arrowColor: colors.black,
      todayBackgroundColor: colors.primaryLight,
      todayDotColor: colors.white,
      dotColor: colors.primary,
      textMonthFontSize: 16,
      textMonthFontWeight: 'bold',
      monthTextColor: colors.black,
      'stylesheet.calendar.main': {
        week: {
          marginTop: 6,
          marginBottom: 0,
          flexDirection: 'row',
          justifyContent: 'space-around',
        },
      },
    }),
    [colors]
  );

  const [open, setOpen] = useState(false);

  const dispatch = useDispatch();

  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const purchases = useSelector((state) => state.purchase.purchases);

  const fetchData = async () => {
    if (USE_FAKE_DATA) {
      dispatch(setUser(mockUserData));
      dispatch(setPurchases(mockPurchases));
      dispatch(setCollections(mockCollections));
      dispatch(setCategories(createMockCategories(defaultCategories)));
      dispatch(setCustomCategories(mockCustomCategories));
      setLoading(false);
      setRefreshing(false);
      return;
    }

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

  const markedDates = useMemo(() => {
    if (loading) return {};

    const dates = {};

    purchases.forEach((item) => {
      const wears = item.wears || [];
      const lastWearDateKey = getDateKeyInTimeZone(wears[wears.length - 1], timeZone);

      wears.forEach((wear) => {
        const dateKey = getDateKeyInTimeZone(wear, timeZone);
        if (!dateKey) return;
        const isLatestWear = dateKey === lastWearDateKey;

        dates[dateKey] = {
          ...dates[dateKey],
          marked: true,
          dotColor: isLatestWear ? colors.secondary : dates[dateKey]?.dotColor || colors.primary,
        };
      });
    });

    return dates;
  }, [colors.primary, colors.secondary, loading, purchases, timeZone]);

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
        {loading ? (
          <HomeLoadingPlaceholders styles={styles} />
        ) : (
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
            <Calendar
              key={colors.mode}
              theme={calendarTheme}
              style={styles.calendar}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setOpen(true);
              }}
              markedDates={markedDates}
            />
          </>
        )}
      </ScrollView>

      <BottomSheet
        title={selectedDate ? formatDate(selectedDate) : ''}
        visible={open}
        onClose={() => {
          setOpen(false);
          setSelectedDate(null);
        }}
        height={'50%'}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.list}>
            <PurchaseList
              purchases={
                selectedDate
                  ? purchases.filter((product) =>
                      itemWasWornOnDate(product, selectedDate, timeZone)
                    )
                  : []
              }
              overlay
              wornDate={selectedDate}
              getOverlayText={(item) => getWearNumberText(item, selectedDate, timeZone)}
              emptyText="Nothing worn on this day"
              navigation={navigation}
              onItemLongPress={() => {}}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const PlaceholderBlock = ({ style, styles }) => <View style={[styles.pBlock, style]} />;

const HomeLoadingPlaceholders = ({ styles }) => {
  return (
    <>
      <View style={styles.totalWearsCard}>
        <View style={styles.pWearsTopRow}>
          <PlaceholderBlock styles={styles} style={styles.pTotalWearsValue} />
          <PlaceholderBlock styles={styles} style={styles.pIcon} />
        </View>
        <PlaceholderBlock styles={styles} style={styles.pTotalWearsSubtext} />
      </View>

      <View style={styles.analyticsCard}>
        <View style={styles.pInsightsHeaderRow}>
          <PlaceholderBlock styles={styles} style={styles.pInsightsTitle} />
          <PlaceholderBlock styles={styles} style={styles.pIcon} />
        </View>
        <View style={styles.pInsightsCoverageRow}>
          <PlaceholderBlock styles={styles} style={styles.pIcon} />
          <PlaceholderBlock styles={styles} style={styles.pInsightsCoverageText} />
        </View>
      </View>

      <View style={styles.pCalendarCard}>
        <View style={styles.pCalendarHeader}>
          <PlaceholderBlock styles={styles} style={styles.pCalendarArrow} />
          <PlaceholderBlock styles={styles} style={styles.pCalendarMonth} />
          <PlaceholderBlock styles={styles} style={styles.pCalendarArrow} />
        </View>
        <PlaceholderBlock styles={styles} style={styles.pCalendarLine} />
        <PlaceholderBlock styles={styles} style={styles.pCalendarLine} />
        <PlaceholderBlock styles={styles} style={styles.pCalendarShortLine} />
      </View>
    </>
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
      paddingHorizontal: 16,
    },
    calendar: {
      borderRadius: 10,
      elevation: 1,
      paddingBottom: 8,
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
    pCalendarCard: {
      backgroundColor: colors.white,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 18,
      elevation: 1,
      gap: 14,
    },
    pBlock: {
      backgroundColor: colors.lightestGrey,
      borderRadius: 8,
    },
    pWearsTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    pTotalWearsValue: {
      width: 48,
      height: 40,
      marginBottom: 10,
    },
    pTotalWearsSubtext: {
      width: 90,
      height: 14,
    },
    pTotalWearsIcon: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primaryLight,
    },
    pInsightsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pInsightsTitle: {
      width: 118,
      height: 18,
    },
    pIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primaryLight,
    },
    pInsightsCoverageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.white,
      elevation: 2,
      marginBottom: 4,
    },
    pInsightsCoverageText: {
      flex: 1,
      height: 14,
      marginRight: 80,
    },
    pCalendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    pCalendarArrow: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    pCalendarMonth: {
      width: 110,
      height: 18,
    },
    pCalendarLine: {
      width: '100%',
      height: 34,
      borderRadius: 8,
    },
    pCalendarShortLine: {
      width: '72%',
      height: 28,
      borderRadius: 8,
    },
    analyticsCard: {
      backgroundColor: colors.white,
      marginBottom: 10,
      borderRadius: 10,
      padding: 14,
      gap: 12,
      elevation: 1,
    },
    totalWearsCard: {
      backgroundColor: colors.white,
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
