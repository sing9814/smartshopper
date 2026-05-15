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
import { getWearLevelData } from '../utils/wears';

const PurchaseList = ({
  purchases,
  loading,
  refreshing,
  onRefresh,
  onItemLongPress,
  overlay,
  navigation,
  selectedItems = [],
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
    const lastWear = item.wears?.[item.wears.length - 1];

    if (!lastWear) return 'Never worn';
    if (lastWear.seconds) return `Last worn ${formatTimeStampNoTime(lastWear)}`;
    return `Last worn ${formatDateShort(lastWear)}`;
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
    const wearLevel = getWearLevelData(item.wears.length);
    const wearLevelColors = colors.wearLevels?.[wearLevel.code] || {
      bg: colors.primaryLight,
      text: colors.primary,
    };

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
            <View style={styles.topGroup}>
              <Text style={styles.title} numberOfLines={1}>
                {item.name}
              </Text>
              <Text
                style={[
                  styles.wearLevel,
                  {
                    backgroundColor: wearLevelColors.bg,
                    color: wearLevelColors.text,
                  },
                ]}
              >
                {wearLevel.emoji} {wearLevel.label}
              </Text>
              {!overlay && (
                <Text style={styles.wears}>
                  {'\u2022'} {item.wears.length} wears
                </Text>
              )}
            </View>
            <Text style={styles.date}>
              {overlay ? `${item.wears.length} wears` : formatDateShort(item.datePurchased)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text numberOfLines={1} style={styles.lastWorn}>
              {getLastWornText(item)}
            </Text>
            <View style={styles.group}>
              <Text style={styles.paidPrice}>${convertCentsToDollars(item.paidPrice)}</Text>
            </View>
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
        <Text style={styles.footerText}>No data to show</Text>
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
    group: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    topGroup: {
      flex: 1,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    wearLevel: {
      paddingVertical: 3,
      paddingBottom: 5,
      paddingHorizontal: 8,
      borderRadius: 50,
      fontSize: 14,
      fontWeight: '500',
      overflow: 'hidden',
    },
    paidPrice: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.black,
      marginRight: 2,
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
