import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../theme/themeContext';
import { deleteDoc } from '../utils/firebase';
import ConfirmationModal from '../components/confirmationModal';
import {
  formatDate,
  formatTimeStamp,
  generateFirestoreTimestampFromDate,
  getDateKeyInTimeZone,
  getDeviceTimeZone,
  timestampToDate,
} from '../utils/date';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases, setCurrentPurchase } from '../redux/actions/purchaseActions';
import Banner from '../components/banner';
import { updatePurchaseWears } from '../utils/firebase';
import DetailsSheet from '../components/detailsSheet';
import WearHistoryChart from '../components/WearHistoryChart';
import { convertCentsToDollars } from '../utils/price';
import { DEFAULT_WEAR_GOAL, getWearGoalProgress, getWearGoalProgressColors } from '../utils/wears';
import { useStatusBar } from '../hooks/useStatusBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import CustomTabBar from '../navigation/CustomTabBar';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const Tab = createMaterialTopTabNavigator();

const sortWearsByDate = (wears) => {
  return [...wears].sort((a, b) => {
    const aTime = timestampToDate(a)?.getTime() || 0;
    const bTime = timestampToDate(b)?.getTime() || 0;

    return aTime - bTime;
  });
};

const DetailsScreen = ({ navigation }) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const timeZone = getDeviceTimeZone();
  useStatusBar(colors.primary);

  const dispatch = useDispatch();

  const purchases = useSelector((state) => state.purchase.purchases);
  const currentPurchase = useSelector((state) => state.purchase.currentPurchase);

  const [modalVisible, setModalVisible] = useState(false);
  const [banner, setBanner] = useState(null);
  const [isAddingWear, setIsAddingWear] = useState(false);
  const [isWearDatePickerOpen, setIsWearDatePickerOpen] = useState(false);
  const [selectedWearDate, setSelectedWearDate] = useState(new Date());
  const [wearProgressTrackWidth, setWearProgressTrackWidth] = useState(0);

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const animatedWearProgress = useSharedValue(0);

  const showBanner = (message, type = 'error') => {
    setBanner({ id: Date.now(), message, type });
  };

  const handleDelete = () => {
    deleteDoc('Purchases', currentPurchase.key);
    const updatedPurchaseList = purchases.filter((p) => p.key !== currentPurchase.key);
    dispatch(setPurchases(updatedPurchaseList));

    navigation.goBack();
  };

  const onPressAddWear = () => {
    if (isAddingWear) return;
    setSelectedWearDate(new Date());
    setIsWearDatePickerOpen(true);
  };

  const addWearForDate = async (wearDate) => {
    if (isAddingWear) return;

    const selectedDateKey = getDateKeyInTimeZone(wearDate, timeZone);
    const wasAlreadyWornOnDate = (currentPurchase.wears || []).some(
      (wear) => getDateKeyInTimeZone(wear, timeZone) === selectedDateKey
    );

    if (wasAlreadyWornOnDate) {
      showBanner('This item already has a wear logged for that day');
      return;
    }

    setIsAddingWear(true);
    const date = generateFirestoreTimestampFromDate(wearDate);

    const newWears = sortWearsByDate([...(currentPurchase.wears || []), date]);

    const updatedPurchases = purchases.map((purchase) =>
      purchase.key === currentPurchase.key ? { ...purchase, wears: newWears } : purchase
    );
    dispatch(setPurchases(updatedPurchases));
    dispatch(setCurrentPurchase({ ...currentPurchase, wears: newWears }));

    try {
      await updatePurchaseWears(currentPurchase.key, newWears);
      showBanner('Wear added successfully!', 'success');
    } finally {
      setIsAddingWear(false);
    }
  };

  const formatCostPerWear = (cents) => {
    if (cents == null) return 'N/A';
    const dollars = cents / 100;
    if (dollars > 0 && dollars < 0.01) return '<$0.01';
    return `$${dollars.toFixed(2)}`;
  };

  const formatWearDate = (wear) => {
    const date = timestampToDate(wear);
    if (!date) return 'N/A';

    const currentYear = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
    }).format(new Date());
    const wearYear = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
    }).format(date);

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone,
      ...(wearYear !== currentYear ? { year: 'numeric' } : {}),
    });
  };

  const wearCount = currentPurchase.wears?.length || 0;
  const wearGoal = currentPurchase.wearGoal ?? DEFAULT_WEAR_GOAL;
  const wearProgress = getWearGoalProgress(wearCount, wearGoal);
  const wearProgressColors = getWearGoalProgressColors(wearProgress.visualPercentage, colors);
  const lastWear = currentPurchase.wears?.[wearCount - 1];
  const categoryName =
    currentPurchase.category?.category ||
    (typeof currentPurchase.category === 'string' ? currentPurchase.category : 'N/A');
  const categoryLabel = categoryName;
  const itemColor = currentPurchase.itemColor;
  const paidPrice = currentPurchase.paidPrice;
  const regularPrice = currentPurchase.regularPrice;
  const costPerWear =
    wearCount > 0 && paidPrice != null ? formatCostPerWear(paidPrice / wearCount) : 'N/A';
  const wearHistory = useMemo(
    () => sortWearsByDate(currentPurchase.wears || []).reverse(),
    [currentPurchase.wears]
  );
  const renderTabBar = useCallback(
    (props) => <CustomTabBar {...props} backgroundColor={colors.primary} />,
    [colors.primary]
  );
  const tabScreenOptions = useMemo(
    () => ({
      swipeEnabled: true,
      lazy: false,
    }),
    []
  );
  const animatedWearProgressBarStyle = useAnimatedStyle(() => ({
    width: wearProgressTrackWidth * animatedWearProgress.value,
  }));

  useEffect(() => {
    if (wearProgressTrackWidth <= 0) return;

    const nextProgress = wearProgress.visualPercentage / 100;

    animatedWearProgress.value = 0;
    animatedWearProgress.value = withDelay(
      120,
      withTiming(nextProgress, {
        duration: 450 + nextProgress * 1100,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [animatedWearProgress, wearProgress.visualPercentage, wearProgressTrackWidth]);

  return (
    <View style={styles.container}>
      {banner && <Banner key={banner.id} message={banner.message} type={banner.type} />}

      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topbarAction}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>
          {currentPurchase.name}
        </Text>
        <View style={styles.topbarActions}>
          <TouchableOpacity
            onPress={() => setIsSheetVisible(true)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.topbarAction}
          >
            <FontAwesome6 name="ellipsis" size={26} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Tab.Navigator
        style={styles.tabNavigator}
        sceneContainerStyle={styles.tabScene}
        tabBar={renderTabBar}
        screenOptions={tabScreenOptions}
      >
        <Tab.Screen name="Summary">
          {() => (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.wearProgressPanel}>
                <View style={styles.wearProgressPanelHeader}>
                  <View>
                    <Text style={styles.wearProgressCount}>{wearCount}</Text>
                    <Text style={styles.titleLabel}>Wears</Text>
                  </View>
                  <View style={styles.wearProgressActionRow}>
                    <Text
                      style={[
                        styles.wearProgress,
                        {
                          backgroundColor: wearProgressColors.bg,
                          color: wearProgressColors.text,
                        },
                      ]}
                    >
                      {wearProgress.code === 'complete' ? 'Goal reached' : wearProgress.detailLabel}
                    </Text>
                    <TouchableOpacity
                      onPress={onPressAddWear}
                      disabled={isAddingWear}
                      activeOpacity={0.75}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      style={[
                        styles.wearProgressAddButton,
                        isAddingWear && styles.addWearButtonDisabled,
                      ]}
                    >
                      <FontAwesome6 name="plus" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={styles.wearProgressBarTrack}
                  onLayout={(event) => {
                    setWearProgressTrackWidth(event.nativeEvent.layout.width);
                  }}
                >
                  <Animated.View
                    style={[
                      styles.wearProgressBarFill,
                      animatedWearProgressBarStyle,
                      {
                        backgroundColor: wearProgressColors.fill,
                      },
                    ]}
                  />
                </View>
                <View style={styles.wearProgressPanelFooter}>
                  <Text style={styles.wearProgressFooterText}>Goal: {wearGoal}</Text>
                  <Text style={styles.wearProgressFooterText}>{wearProgress.label}</Text>
                </View>
              </View>

              <WearHistoryChart wears={currentPurchase.wears} timeZone={timeZone} />

              <View>
                <View style={styles.listRow}>
                  <View style={styles.rowText}>
                    <Text style={styles.titleLabel}>Last worn</Text>
                    <Text style={styles.valueText}>
                      {lastWear ? formatWearDate(lastWear) : 'Never worn'}
                    </Text>
                  </View>
                </View>

                {paidPrice != null && (
                  <View style={styles.listRow}>
                    <View style={styles.rowText}>
                      <Text style={styles.titleLabel}>Price</Text>
                      <View style={styles.priceContainerInline}>
                        <Text style={styles.valueText}>${convertCentsToDollars(paidPrice)}</Text>
                        {regularPrice && (
                          <Text style={styles.regularPrice}>
                            ${convertCentsToDollars(regularPrice)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.rowMeta}>
                      <Text style={styles.titleLabel}>Cost per wear</Text>
                      <Text style={styles.valueText}>{costPerWear}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.listRow}>
                  <View style={[styles.rowText, styles.categoryTextBlock]}>
                    <Text style={styles.titleLabel}>Category</Text>
                    <Text style={styles.categoryValue} numberOfLines={1}>
                      {categoryLabel}
                    </Text>
                  </View>

                  {itemColor ? (
                    <View style={styles.rowMeta}>
                      <Text style={styles.titleLabel}>Color</Text>
                      <View style={styles.colorValue}>
                        <View
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: itemColor.hex,
                              borderColor:
                                itemColor.name === 'White' || itemColor.name === 'Black'
                                  ? colors.lightGrey
                                  : itemColor.hex,
                            },
                          ]}
                        />
                        <Text style={styles.valueText}>{itemColor.name}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.rowMeta}>
                      <Text style={styles.titleLabel}>Purchased</Text>
                      <Text style={styles.valueText}>
                        {formatDate(currentPurchase.datePurchased)}
                      </Text>
                    </View>
                  )}
                </View>

                {itemColor && (
                  <View style={styles.listRow}>
                    <View style={styles.rowText}>
                      <Text style={styles.titleLabel}>Purchased</Text>
                      <Text style={styles.valueText}>
                        {formatDate(currentPurchase.datePurchased)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.noteBlock}>
                <Text style={styles.titleLabel}>Notes</Text>
                <Text style={styles.note}>{currentPurchase.note || 'No notes yet.'}</Text>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaText}>
                  Created: {formatTimeStamp(currentPurchase.dateCreated)}
                </Text>
                {currentPurchase.edited && (
                  <Text style={styles.metaText}>
                    Last edited: {formatTimeStamp(currentPurchase.edited)}
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
        </Tab.Screen>

        <Tab.Screen name="History">
          {() => (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.historySummary}>
                <View style={styles.historySummaryCountRow}>
                  <View style={styles.historySummaryTopRow}>
                    <Text style={styles.historySummaryCount}>{wearCount}</Text>
                  </View>
                  <Text style={styles.historySummaryText}>
                    {wearCount === 1 ? 'Wear logged' : 'Wears logged'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onPressAddWear}
                  disabled={isAddingWear}
                  activeOpacity={0.75}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  style={[
                    styles.historyAddWearButton,
                    isAddingWear && styles.addWearButtonDisabled,
                  ]}
                >
                  <FontAwesome6 name="plus" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {wearHistory.length > 0 ? (
                <View>
                  {wearHistory.map((wear, index) => (
                    <View
                      key={`${getDateKeyInTimeZone(wear, timeZone)}-${index}`}
                      style={styles.wearRow}
                    >
                      <Text style={styles.wearRowNumber}>{wearHistory.length - index}.</Text>
                      <Text style={styles.wearRowDate}>{formatWearDate(wear)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.historyEmpty}>
                  <Text style={styles.historyEmptyTitle}>No wears logged yet</Text>
                  <Text style={styles.historyEmptyText}>
                    Add a wear from the Summary tab to start building this history.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <ConfirmationModal
        data={currentPurchase.name}
        visible={modalVisible}
        onConfirm={handleDelete}
        onCancel={() => setModalVisible(false)}
      />

      <DatePicker
        modal
        open={isWearDatePickerOpen}
        date={selectedWearDate}
        maximumDate={new Date()}
        mode="date"
        title="When did you wear it?"
        confirmText="Add wear"
        onConfirm={(date) => {
          setIsWearDatePickerOpen(false);
          setSelectedWearDate(date);
          addWearForDate(date);
        }}
        onCancel={() => setIsWearDatePickerOpen(false)}
      />

      <DetailsSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        navigation={navigation}
        currentPurchase={currentPurchase}
        purchases={purchases}
        dispatch={dispatch}
        setPurchases={setPurchases}
        setModalVisible={setModalVisible}
      />
    </View>
  );
};

const createStyles = (colors, insets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    label: {
      fontSize: 13,
      color: colors.gray,
      marginBottom: 4,
    },
    topbar: {
      width: '100%',
      backgroundColor: colors.primary,
      gap: 12,
      paddingTop: 10,
      paddingBottom: 13,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topbarTitle: {
      color: colors.white,
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    topbarActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    topbarAction: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabNavigator: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    tabScene: {
      backgroundColor: colors.bg,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 160 + insets.bottom,
    },
    listRow: {
      backgroundColor: colors.white,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 2,
    },
    rowText: {
      flex: 1,
      gap: 6,
      alignItems: 'flex-start',
    },
    categoryTextBlock: {
      flex: 1.35,
    },
    rowMeta: {
      flex: 1,
      gap: 6,
      alignItems: 'flex-end',
      minWidth: 0,
    },
    titleLabel: {
      fontSize: 13,
      color: colors.gray,
    },
    wearProgressPanel: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginTop: 10,
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 12,
      gap: 12,
      overflow: 'hidden',
    },
    wearProgressPanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    wearProgressActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      flexShrink: 1,
    },
    wearProgressCount: {
      color: colors.black,
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 32,
      paddingBottom: 4,
      marginLeft: -2,
    },
    wearProgressAddButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wearProgress: {
      paddingVertical: 3,
      paddingBottom: 5,
      paddingHorizontal: 8,
      borderRadius: 50,
      fontSize: 14,
      fontWeight: '500',
      minHeight: 27,
      overflow: 'hidden',
    },
    wearProgressBarTrack: {
      alignSelf: 'stretch',
      height: 18,
      borderRadius: 999,
      backgroundColor: colors.wearGoalProgressTrack,
      overflow: 'hidden',
    },
    wearProgressBarFill: {
      height: '100%',
      borderRadius: 999,
    },
    wearProgressPanelFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    wearProgressFooterText: {
      color: colors.gray,
      // fontSize: 13,
      // fontWeight: '500',
    },
    valueText: {
      color: colors.black,
      fontSize: 15,
      fontWeight: '500',
      textAlign: 'right',
    },
    categoryValue: {
      color: colors.black,
      fontSize: 15,
      fontWeight: '500',
      flexShrink: 1,
    },
    colorValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    colorSwatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
    },
    addWearButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addWearButtonDisabled: {
      opacity: 0.55,
    },
    paidPrice: {
      fontSize: 21,
      fontWeight: '600',
      color: colors.black,
    },
    regularPrice: {
      textDecorationLine: 'line-through',
      color: colors.gray,
      marginLeft: 2,
    },
    priceContainerInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 22,
    },
    noteBlock: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 2,
      gap: 4,
    },
    note: {
      color: colors.black,
      fontSize: 15,
      lineHeight: 22,
    },
    metaBlock: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 2,
      gap: 4,
    },
    metaText: {
      color: colors.gray,
      fontSize: 13,
    },
    historySummary: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginBottom: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    historySummaryCountRow: {
      flex: 1,
    },
    historySummaryTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    historySummaryCount: {
      color: colors.black,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 28,
    },
    historySummaryText: {
      paddingTop: 8,
      color: colors.gray,
    },
    historyAddWearButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wearRow: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 13,
      marginBottom: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    wearRowDate: {
      color: colors.black,
      fontSize: 15,
      fontWeight: '500',
      flex: 1,
    },
    wearRowNumber: {
      color: colors.gray,
      fontWeight: '500',
      marginRight: 8,
    },
    historyEmpty: {
      flex: 1,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingBottom: 80,
      minHeight: 260,
    },
    historyEmptyTitle: {
      color: colors.black,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    historyEmptyText: {
      color: colors.gray,
      lineHeight: 21,
      textAlign: 'center',
    },
  });

export default DetailsScreen;
