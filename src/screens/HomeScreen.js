import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { fetchAllUserData, fetchMergedCategories } from '../utils/firebase';
import Header from '../components/header';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases, setCollections } from '../redux/actions/purchaseActions';
import { setUser } from '../redux/actions/userActions';
import { setCategories, setCustomCategories } from '../redux/actions/userActions';
import BottomSheet from '../components/bottomSheet';
import {
  DISPLAY_LOCALE,
  formatDate,
  getDateKeyInTimeZone,
  getDeviceLocale,
  getDeviceTimeZone,
  getFirstDayOfWeek,
} from '../utils/date';
import PurchaseList from '../components/purchaseList';
import { categories as defaultCategories } from '../../assets/json/categories';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { USE_FAKE_DATA, createMockCategories, selectedMockProfile } from '../utils/mockData';
import auth from '@react-native-firebase/auth';
import { getGuestData } from '../utils/guestStorage';
import { getCollectionFolderBackground, getCollectionFolderColor } from '../utils/collectionColor';

const mergeLocalCategories = (categories, customCategories) => {
  const merged = createMockCategories(categories, []);

  customCategories.forEach(({ id, category, name }) => {
    const parent = merged.find((item) => item.name === category);
    if (!parent) return;
    parent.subCategories.push({ id, name, custom: true });
  });

  return merged;
};

const configureCalendarLocale = (locale) => {
  if (!LocaleConfig.locales[locale]) {
    const format = (date, options) =>
      new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
    const months = Array.from({ length: 12 }, (_, month) => new Date(Date.UTC(2020, month, 1)));
    const sunday = new Date(Date.UTC(2020, 5, 7));
    const days = Array.from({ length: 7 }, (_, day) => new Date(sunday.getTime() + day * 86400000));
    LocaleConfig.locales[locale] = {
      monthNames: months.map((date) => format(date, { month: 'long' })),
      monthNamesShort: months.map((date) => format(date, { month: 'short' })),
      dayNames: days.map((date) => format(date, { weekday: 'long' })),
      dayNamesShort: days.map((date) => format(date, { weekday: 'short' })),
      today: 'Today',
    };
  }

  LocaleConfig.defaultLocale = locale;
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
  const tabBarHeight = useBottomTabBarHeight();
  const styles = createStyles(colors, tabBarHeight);
  const { height } = useWindowDimensions();
  const deviceLocale = getDeviceLocale();
  const timeZone = getDeviceTimeZone();
  const firstDayOfWeek = getFirstDayOfWeek(deviceLocale);
  configureCalendarLocale(DISPLAY_LOCALE);
  useStatusBar(colors.primary);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.black,
      calendarBackground: colors.white,
      textSectionTitleColor: colors.textSectionTitleColor,
      selectedDayBackgroundColor: colors.primaryLight,
      selectedDayTextColor: colors.primaryDark,
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
          marginTop: 10,
          marginBottom: 5,
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
  const tabCloseTimeoutRef = useRef(null);

  const purchases = useSelector((state) => state.purchase.purchases);
  const collections = useSelector((state) => state.purchase.collections);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) return;

      if (tabCloseTimeoutRef.current) {
        clearTimeout(tabCloseTimeoutRef.current);
      }

      setOpen(false);
      tabCloseTimeoutRef.current = setTimeout(() => {
        setSelectedDate(null);
        tabCloseTimeoutRef.current = null;
      }, 220);
    });

    return () => {
      unsubscribe();
      if (tabCloseTimeoutRef.current) {
        clearTimeout(tabCloseTimeoutRef.current);
      }
    };
  }, [navigation]);

  const fetchData = async () => {
    if (USE_FAKE_DATA) {
      dispatch(setUser(selectedMockProfile.userData));
      dispatch(setPurchases(selectedMockProfile.purchases));
      dispatch(setCollections(selectedMockProfile.collections));
      dispatch(
        setCategories(createMockCategories(defaultCategories, selectedMockProfile.customCategories))
      );
      dispatch(setCustomCategories(selectedMockProfile.customCategories));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const guestData = await getGuestData();
    const hasLocalGuest = !auth().currentUser && guestData.active && guestData.userData?.isGuest;

    if (hasLocalGuest) {
      dispatch(setUser(guestData.userData));
      dispatch(setPurchases(guestData.purchases));
      dispatch(setCollections(guestData.collections));
      dispatch(setCategories(mergeLocalCategories(defaultCategories, guestData.customCategories)));
      dispatch(setCustomCategories(guestData.customCategories));
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
    const addDot = (dateKey, key, color) => {
      const existingDots = dates[dateKey]?.dots || [];
      if (existingDots.some((dot) => dot.color === color) || existingDots.length >= 3) return;

      dates[dateKey] = {
        ...dates[dateKey],
        marked: true,
        dots: [...existingDots, { key, color, selectedDotColor: color }],
      };
    };
    const collectionEvents = [];
    const collectionItemIdsByDate = {};

    collections.forEach((collection) => {
      (collection.wearHistory || []).forEach((event) => {
        const dateKey = getDateKeyInTimeZone(event.date, timeZone);
        if (!dateKey) return;

        collectionEvents.push({ collection, dateKey });
        collectionItemIdsByDate[dateKey] ??= new Set();
        (event.itemIds || []).forEach((itemId) => collectionItemIdsByDate[dateKey].add(itemId));
      });
    });

    purchases.forEach((item) => {
      const wears = item.wears || [];

      wears.forEach((wear) => {
        const dateKey = getDateKeyInTimeZone(wear, timeZone);
        if (!dateKey) return;
        if (collectionItemIdsByDate[dateKey]?.has(item.key)) return;
        addDot(dateKey, 'standalone-items', colors.primary);
      });
    });

    collectionEvents.forEach(({ collection, dateKey }) => {
      const folderColor = getCollectionFolderColor(collection.folderColor, colors);
      const collectionColor =
        collection.folderColor?.name === 'White' && colors.mode !== 'dark'
          ? colors.gray
          : folderColor;
      addDot(dateKey, `collection-${collection.id}`, collectionColor);
    });

    if (selectedDate) {
      dates[selectedDate] = {
        ...dates[selectedDate],
        selected: true,
        selectedColor: colors.primaryLight,
        selectedTextColor: colors.primaryDark,
      };
    }

    return dates;
  }, [
    colors.itemColorOptions,
    colors.gray,
    colors.mode,
    colors.primary,
    colors.primaryDark,
    colors.primaryLight,
    collections,
    loading,
    purchases,
    selectedDate,
    timeZone,
  ]);

  const totalWears = useMemo(
    () => purchases.reduce((total, item) => total + (item.wears?.length || 0), 0),
    [purchases]
  );
  const canAddWearForSelectedDate =
    selectedDate && selectedDate <= getDateKeyInTimeZone(new Date(), timeZone);
  const selectedCollectionWears = useMemo(() => {
    if (!selectedDate) return [];

    return collections.flatMap((collection) =>
      (collection.wearHistory || [])
        .filter((event) => getDateKeyInTimeZone(event.date, timeZone) === selectedDate)
        .map((event) => ({ collection, event }))
    );
  }, [collections, selectedDate, timeZone]);
  const selectedCollectionItemIds = useMemo(
    () => new Set(selectedCollectionWears.flatMap(({ event }) => event.itemIds || [])),
    [selectedCollectionWears]
  );
  const selectedStandaloneItems = useMemo(() => {
    if (!selectedDate) return [];

    return purchases.filter(
      (item) =>
        itemWasWornOnDate(item, selectedDate, timeZone) && !selectedCollectionItemIds.has(item.key)
    );
  }, [purchases, selectedCollectionItemIds, selectedDate, timeZone]);

  const openItemsForWear = () => {
    const initialWearDate = selectedDate;
    setOpen(false);
    setSelectedDate(null);
    navigation.navigate('Purchases', {
      screen: 'ItemTabs',
      params: {
        screen: 'Items',
        params: { initialWearDate },
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header title={loading ? ' ' : `Overview`} />

      <ScrollView
        style={styles.scroller}
        contentContainerStyle={[
          styles.scrollView,
          open && { paddingBottom: height * 0.5 + styles.scrollView.paddingBottom },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <HomeLoadingPlaceholders styles={styles} />
        ) : (
          <>
            <View style={styles.totalWearsCard}>
              <View style={styles.totalWearsIcon}>
                <Ionicons name="shirt-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.analyticsValue}>{totalWears}</Text>
              <Text style={styles.analyticsSubtext}>Total wears</Text>
            </View>

            <Calendar
              key={`${colors.mode}-${DISPLAY_LOCALE}-${firstDayOfWeek}`}
              firstDay={firstDayOfWeek}
              markingType="multi-dot"
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
            {selectedCollectionWears.map(({ collection, event }, index) => {
              const folderColor = getCollectionFolderColor(collection.folderColor, colors);
              const itemNames = (collection.items || [])
                .map((itemId) => purchases.find((item) => item.key === itemId)?.name)
                .filter(Boolean)
                .join(', ');

              return (
                <TouchableOpacity
                  key={`${collection.id}-${getDateKeyInTimeZone(event.date, timeZone)}-${index}`}
                  style={styles.collectionWearRow}
                  onPress={() => {
                    setOpen(false);
                    setSelectedDate(null);
                    navigation.navigate('Purchases', {
                      screen: 'CollectionDetail',
                      params: { collection, animationEnabled: false },
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${collection.name} outfit`}
                >
                  <View
                    style={[
                      styles.collectionWearIcon,
                      {
                        backgroundColor: getCollectionFolderBackground(
                          collection.folderColor,
                          colors
                        ),
                      },
                    ]}
                  >
                    <Ionicons name="folder-outline" size={23} color={folderColor} />
                  </View>
                  <View style={styles.collectionWearText}>
                    <Text style={styles.collectionWearName} numberOfLines={1}>
                      {collection.name}
                    </Text>
                    <Text style={styles.collectionWearLabel} numberOfLines={1} ellipsizeMode="tail">
                      {itemNames || 'No items'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {(selectedStandaloneItems.length > 0 || selectedCollectionWears.length === 0) && (
              <PurchaseList
                purchases={selectedStandaloneItems}
                overlay
                wornDate={selectedDate}
                getOverlayText={(item) => getWearNumberText(item, selectedDate, timeZone)}
                emptyText="Nothing worn on this day"
                emptyActionTitle={canAddWearForSelectedDate ? 'Add a wear' : undefined}
                onEmptyAction={canAddWearForSelectedDate ? openItemsForWear : undefined}
                itemContainerStyle={styles.calendarListItem}
                navigation={navigation}
                onItemLongPress={() => {}}
              />
            )}
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

      <View style={styles.pCalendarCard}>
        <View style={styles.pCalendarHeader}>
          <PlaceholderBlock styles={styles} style={styles.pCalendarArrow} />
          <PlaceholderBlock styles={styles} style={styles.pCalendarMonth} />
          <PlaceholderBlock styles={styles} style={styles.pCalendarArrow} />
        </View>
        <PlaceholderBlock styles={styles} style={styles.pCalendarLine} />
        <PlaceholderBlock styles={styles} style={styles.pCalendarLine} />
        <PlaceholderBlock styles={styles} style={styles.pCalendarLine} />
        <PlaceholderBlock styles={styles} style={styles.pCalendarLine} />
        <PlaceholderBlock styles={styles} style={styles.pCalendarShortLine} />
      </View>
    </>
  );
};

const createStyles = (colors, tabBarHeight) =>
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
    calendarListItem: {
      marginBottom: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
    },
    collectionWearRow: {
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
    },
    collectionWearIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectionWearText: {
      flex: 1,
      gap: 4,
    },
    collectionWearName: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '600',
    },
    collectionWearLabel: {
      color: colors.gray,
      fontSize: 13,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroller: {
      flex: 1,
    },
    scrollView: {
      flexGrow: 1,
      paddingTop: 16,
      paddingBottom: tabBarHeight + 16,
      paddingHorizontal: 16,
    },
    calendar: {
      borderRadius: 10,
      elevation: 1,
      paddingBottom: 10,
      marginBottom: 300,
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
      minHeight: 300,
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
    pIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primaryLight,
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
      height: 36,
      borderRadius: 8,
    },
    pCalendarShortLine: {
      width: '72%',
      height: 34,
      borderRadius: 8,
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
      // backgroundColor: colors.primaryLight,
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
  });

export default HomeScreen;
