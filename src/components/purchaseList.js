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
import { formatDateShort } from '../utils/date';
import { useDispatch } from 'react-redux';
import { setCurrentPurchase } from '../redux/actions/purchaseActions';
import { convertCentsToDollars } from '../utils/price';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

  const getCategoryName = (item) => {
    if (item?.subCategory?.name) {
      const akaIndex = item.subCategory.name.toLowerCase().indexOf('aka');
      if (akaIndex !== -1) {
        return item.subCategory.name.substring(0, akaIndex);
      }
      return item.subCategory.name;
    }
    return item.category;
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
        {selectedItems.length > 0 && (
          <View style={styles.selectionIndicator}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={isSelected ? colors.primary : colors.lightGrey}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.priceGroup}>
              <Text style={styles.paidPrice}>${convertCentsToDollars(item.paidPrice)}</Text>
              {item.regularPrice && (
                <Text style={styles.regularPrice}>${convertCentsToDollars(item.regularPrice)}</Text>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            {item.category?.category && (
              <Text
                style={[
                  styles.category,
                  { backgroundColor: colors[item.category?.category.split(' ')[0]] },
                ]}
              >
                {getCategoryName(item.category)}
              </Text>
            )}
            <Text style={styles.metaText}>{item.wears.length} wears</Text>
            <Text style={styles.metaText}>
              {overlay ? 'Tracked' : formatDateShort(item.datePurchased)}
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.note}>
            {item.note || '(no note)'}
          </Text>
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
      paddingTop: 4,
      paddingBottom: 65,
      flexGrow: 0,
    },
    itemContainer: {
      backgroundColor: colors.white,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomColor: colors.bg,
      marginBottom: 3,
      paddingHorizontal: 14,
    },
    selectionIndicator: {
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 6,
    },
    title: {
      flex: 1,
      flexShrink: 1,
      color: colors.black,
      fontWeight: '600',
      fontSize: 16,
      marginRight: 12,
    },
    note: {
      color: colors.gray,
      fontSize: 13,
      flexShrink: 1,
    },
    priceGroup: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    headerRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    category: {
      color: colors.white,
      paddingVertical: 3,
      paddingBottom: 5,
      paddingHorizontal: 8,
      borderRadius: 50,
      fontSize: 13,
      overflow: 'hidden',
    },
    paidPrice: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.green,
      marginRight: 2,
    },
    regularPrice: {
      textDecorationLine: 'line-through',
      color: colors.gray,
      fontSize: 13,
    },
    metaText: {
      fontSize: 13,
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
