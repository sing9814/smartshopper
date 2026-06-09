import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/themeContext';
import { formatDateShort, formatTimeStampNoTime } from '../utils/date';
import { useDispatch } from 'react-redux';
import { setCurrentPurchase } from '../redux/actions/purchaseActions';
import { convertCentsToDollars } from '../utils/price';
import { DEFAULT_WEAR_GOAL, getWearGoalProgress, getWearGoalProgressColors } from '../utils/wears';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PurchaseList = ({
  purchases,
  loading,
  refreshing,
  onRefresh,
  onItemLongPress,
  overlay,
  wornDate,
  getOverlayText,
  emptyText = 'No items yet',
  navigation,
  selectedItems = [],
  onAddWear,
  addingWearItemId,
  isWearLoggedToday,
}) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch();

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>No more data to show</Text>
    </View>
  );

  const onPress = (item) => {
    const isSelectionMode = selectedItems.length > 0;

    if (isSelectionMode) {
      onItemLongPress?.(item);
    } else {
      dispatch(setCurrentPurchase(item));
      navigation.navigate('Details', { purchase: item });
    }
  };

  const getLastWornText = (item) => {
    if (getOverlayText) return getOverlayText(item);
    if (wornDate) return `Worn ${formatDateShort(wornDate)}`;

    const lastWear = item.wears?.[item.wears.length - 1];

    if (!lastWear) return 'Never worn';
    if (lastWear.seconds) return `Last worn ${formatTimeStampNoTime(lastWear)}`;
    return `Last worn ${formatDateShort(lastWear)}`;
  };

  const isMostRecentOverlay = (item) => {
    return overlay && getLastWornText(item).toLowerCase().includes('most recent');
  };

  const getPriceText = (item) => {
    const price = item.paidPrice;
    if (price == null) return 'No price';

    return `$${convertCentsToDollars(price)}`;
  };

  const getCategoryText = (item) => {
    if (item.category?.category) return item.category.category;
    if (typeof item.category === 'string') return item.category;
    return '';
  };

  const renderPlaceholder = () => (
    <View>
      <View style={[styles.placeholder, { opacity: 1 }]} />
      <View style={[styles.placeholder, { opacity: 0.9 }]} />
      <View style={[styles.placeholder, { opacity: 0.5 }]} />
      <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
    </View>
  );

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.key);
    const categoryText = getCategoryText(item);
    const wearCount = item.wears?.length || 0;
    const wearGoal = item.wearGoal ?? DEFAULT_WEAR_GOAL;
    const wearProgress = getWearGoalProgress(wearCount, wearGoal);
    const wearProgressColors = getWearGoalProgressColors(wearProgress.visualPercentage, colors);
    const showWearAction = !overlay && selectedItems.length === 0 && onAddWear;
    const isAddingWear = addingWearItemId === item.key;
    const hasWearLoggedToday = isWearLoggedToday?.(item);
    const isWearButtonDisabled = isAddingWear || hasWearLoggedToday;
    let addWearButtonLabel = 'Wear';
    if (hasWearLoggedToday) {
      addWearButtonLabel = 'Worn today';
    } else if (isAddingWear) {
      addWearButtonLabel = 'Adding';
    }

    return (
      <TouchableOpacity
        onPress={() => onPress(item)}
        onLongPress={() => onItemLongPress?.(item)}
        style={[
          styles.itemContainer,
          isSelected && {
            backgroundColor: colors.primaryLight,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <View style={styles.textContainer}>
          <View style={styles.row}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.date}>{overlay ? `${wearCount} wears` : getPriceText(item)}</Text>
          </View>
          {!overlay && (
            <View style={styles.row}>
              <View style={styles.wearRow}>
                <Text
                  style={[
                    styles.wearProgress,
                    {
                      backgroundColor: wearProgressColors.bg,
                      color: wearProgressColors.text,
                    },
                  ]}
                >
                  {wearProgress.label} goal
                </Text>
                {categoryText ? (
                  <>
                    <Text style={styles.metaDot}>{'\u2022'}</Text>
                    <Text style={styles.categoryText} numberOfLines={1}>
                      {categoryText}
                    </Text>
                  </>
                ) : null}
              </View>
              <Text style={styles.wears}>{wearCount} wears</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text
              numberOfLines={1}
              style={[styles.lastWorn, isMostRecentOverlay(item) && styles.mostRecentWear]}
            >
              {getLastWornText(item)}
            </Text>
            {showWearAction && (
              <TouchableOpacity
                onPress={() => onAddWear(item)}
                disabled={isWearButtonDisabled}
                style={[
                  styles.addWearButton,
                  hasWearLoggedToday && styles.addWearButtonLogged,
                  isWearButtonDisabled && styles.addWearButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  hasWearLoggedToday ? `${item.name} worn today` : `Add wear for ${item.name}`
                }
              >
                <Ionicons
                  name={hasWearLoggedToday ? 'checkmark-circle-outline' : 'add-circle-outline'}
                  size={17}
                  color={hasWearLoggedToday ? colors.gray : colors.primary}
                />
                <Text style={[styles.addWearText, hasWearLoggedToday && styles.addWearTextLogged]}>
                  {addWearButtonLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (purchases.length > 0) {
      return (
        <FlatList
          data={purchases}
          contentContainerStyle={styles.list}
          ListFooterComponent={renderFooter}
          refreshControl={
            onRefresh && <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderItem}
        />
      );
    }
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>{emptyText}</Text>
      </View>
    );
  };

  return <View style={styles.container}>{loading ? renderPlaceholder() : renderContent()}</View>;
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    list: {
      paddingBottom: 65,
      flexGrow: 0,
    },
    itemContainer: {
      backgroundColor: colors.white,
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomColor: colors.bg,
      marginBottom: 2,
      paddingHorizontal: 16,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 6,
    },
    title: {
      flexShrink: 1,
      color: colors.black,
      fontWeight: '600',
      fontSize: 16,
    },
    lastWorn: {
      color: colors.gray,
      flexShrink: 1,
      marginRight: 30,
    },
    mostRecentWear: {
      color: colors.secondary,
      fontWeight: '500',
    },
    wearRow: {
      flex: 1,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      marginRight: 10,
    },
    categoryText: {
      color: colors.gray,
      fontSize: 14,
      flexShrink: 1,
    },
    metaDot: {
      color: colors.gray,
      fontSize: 14,
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    wearProgress: {
      marginTop: 6,
      paddingVertical: 3,
      paddingBottom: 5,
      paddingHorizontal: 8,
      borderRadius: 50,
      fontSize: 14,
      fontWeight: '500',
      overflow: 'hidden',
    },
    addWearButton: {
      minWidth: 70,
      height: 32,
      borderRadius: 8,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 4,
      backgroundColor: colors.primaryLight,
    },
    addWearButtonLogged: {
      minWidth: 104,
      backgroundColor: colors.bg,
    },
    addWearButtonDisabled: {
      opacity: 0.6,
    },
    addWearText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    addWearTextLogged: {
      color: colors.gray,
    },
    date: {
      fontSize: 14,
      color: colors.gray,
      marginLeft: 10,
    },
    wears: {
      fontSize: 14,
      color: colors.gray,
    },
    footer: {
      padding: 8,
      alignItems: 'center',
    },
    footerText: {
      color: colors.gray,
    },
    placeholder: {
      backgroundColor: colors.white,
      width: '100%',
      height: 80,
      marginBottom: 2,
    },
    loadingIndicator: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 10,
    },
  });

export default PurchaseList;
