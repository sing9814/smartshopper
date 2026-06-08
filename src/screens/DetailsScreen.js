import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../theme/themeContext';
import { deleteDoc } from '../utils/firebase';
import ConfirmationModal from '../components/confirmationModal';
import {
  formatDate,
  formatTimeStamp,
  formatTimeStampNoTime,
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
import { DEFAULT_WEAR_GOAL, getWearGoalProgress } from '../utils/wears';
import { useStatusBar } from '../hooks/useStatusBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import CustomTabBar from '../navigation/CustomTabBar';

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

  const [isSheetVisible, setIsSheetVisible] = useState(false);

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

  const formatWearHistoryDate = (wear) => {
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
      month: 'long',
      day: 'numeric',
      timeZone,
      ...(wearYear !== currentYear ? { year: 'numeric' } : {}),
    });
  };

  const wearCount = currentPurchase.wears?.length || 0;
  const wearGoal = currentPurchase.wearGoal ?? DEFAULT_WEAR_GOAL;
  const wearProgress = getWearGoalProgress(wearCount, wearGoal);
  const wearProgressColors = colors.wearGoalProgress?.[wearProgress.code] || {
    bg: colors.primaryLight,
    text: colors.primary,
  };
  const lastWear = currentPurchase.wears?.[wearCount - 1];
  const categoryName =
    currentPurchase.category?.category ||
    (typeof currentPurchase.category === 'string' ? currentPurchase.category : 'N/A');
  const categoryLabel = categoryName;
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

  return (
    <View style={styles.container}>
      {banner && <Banner key={banner.id} message={banner.message} type={banner.type} />}

      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
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
              <View style={styles.heroRow}>
                <View style={styles.heroText}>
                  <Text style={styles.label}>Name</Text>
                  <Text style={styles.title} numberOfLines={2}>
                    {currentPurchase.name}
                  </Text>
                </View>

                <View style={styles.priceBlock}>
                  <Text style={styles.label}>Price</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.paidPrice}>
                      {paidPrice != null ? `$${convertCentsToDollars(paidPrice)}` : 'No price'}
                    </Text>
                    {regularPrice && (
                      <Text style={styles.regularPrice}>
                        ${convertCentsToDollars(regularPrice)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View>
                <View style={styles.listRow}>
                  <View style={[styles.rowText, styles.categoryTextBlock]}>
                    <Text style={styles.titleLabel}>Category</Text>
                    <Text style={styles.categoryValue} numberOfLines={1}>
                      {categoryLabel}
                    </Text>
                  </View>

                  <View style={styles.rowMeta}>
                    <Text style={styles.titleLabel}>Purchased</Text>
                    <Text style={styles.valueText}>
                      {formatDate(currentPurchase.datePurchased)}
                    </Text>
                  </View>
                </View>

                <View style={styles.listRow}>
                  <View style={styles.rowText}>
                    <Text style={styles.titleLabel}>Wear progress</Text>
                    <Text
                      style={[
                        styles.wearProgress,
                        {
                          backgroundColor: wearProgressColors.bg,
                          color: wearProgressColors.text,
                        },
                      ]}
                    >
                      {wearProgress.detailLabel}
                    </Text>
                  </View>

                  <View style={styles.rowMeta}>
                    <Text style={styles.titleLabel}>Wear count</Text>
                    <View style={styles.wearCountRow}>
                      <Text style={styles.valueText}>
                        {wearCount} / {wearGoal} wears
                      </Text>
                      <TouchableOpacity
                        onPress={onPressAddWear}
                        disabled={isAddingWear}
                        activeOpacity={0.75}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        style={[styles.addWearButton, isAddingWear && styles.addWearButtonDisabled]}
                      >
                        <FontAwesome6 name="plus" size={11} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.listRow}>
                  <View style={styles.rowText}>
                    <Text style={styles.titleLabel}>Last worn</Text>
                    <Text style={styles.valueText}>
                      {lastWear ? formatTimeStampNoTime(lastWear) : 'Never worn'}
                    </Text>
                  </View>

                  <View style={styles.rowMeta}>
                    <Text style={styles.titleLabel}>Cost per wear</Text>
                    <Text style={styles.valueText}>{costPerWear}</Text>
                  </View>
                </View>
              </View>

              <WearHistoryChart wears={currentPurchase.wears} timeZone={timeZone} />

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
                      <Text style={styles.wearRowDate}>{formatWearHistoryDate(wear)}</Text>
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
      gap: 6,
      paddingTop: 10,
      paddingBottom: 13,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    heroRow: {
      backgroundColor: colors.white,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 18,
      marginBottom: 2,
      gap: 16,
    },
    heroText: {
      flex: 1,
    },
    title: {
      color: colors.black,
      fontWeight: '700',
      fontSize: 21,
      flexShrink: 1,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    priceContainer: {
      alignItems: 'flex-end',
      gap: 2,
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
    wearCountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 27,
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
