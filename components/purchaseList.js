import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import colors from '../utils/colors';
import { formatDateShort } from '../utils/date';

const PurchaseList = ({
  purchases,
  loading,
  refreshing,
  onRefresh,
  onItemPress,
  onItemLongPress,
  overlay,
}) => {
  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>No more data to show</Text>
    </View>
  );

  const getCategoryName = (item) => {
    if (item?.subCategory) {
      const akaIndex = item.subCategory.toLowerCase().indexOf('aka');
      if (akaIndex !== -1) {
        return item.subCategory.substring(0, akaIndex);
      }
      return item.subCategory;
    }
    return item.category;
  };

  const renderPlaceholder = () => (
    <View>
      <View style={[styles.placeholder, { opacity: 1 }]}></View>
      <View style={[styles.placeholder, { opacity: 0.5 }]}></View>
      <View style={[styles.placeholder, { opacity: 0.3 }]}></View>
      <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => onItemPress(item)}
      onLongPress={() => onItemLongPress(item)}
      style={styles.itemContainer}
    >
      <View style={styles.textContainer}>
        <View style={styles.row}>
          <View style={styles.topGroup}>
            <Text style={styles.title} numberOfLines={2}>
              {item.name}
            </Text>
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
            {!overlay && <Text style={styles.wears}>• {item.wears} wears</Text>}
          </View>
          <Text style={styles.date}>
            {overlay ? `${item.wears} wears` : formatDateShort(item.datePurchased)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text numberOfLines={1} style={styles.note}>
            {item.note || '(no note)'}
          </Text>
          <View style={styles.group}>
            <Text style={styles.paidPrice}>${item.paidPrice || item.regularPrice}</Text>
            {item.paidPrice && <Text style={styles.regularPrice}>${item.regularPrice}</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 65,
    flexGrow: 0,
    marginHorizontal: 4,
  },
  itemContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 10,
    borderBottomColor: colors.bg,
    marginBottom: 2,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  title: {
    flexShrink: 1,
    color: colors.black,
    fontWeight: '600',
    fontSize: 16,
  },
  note: {
    color: 'gray',
    flexShrink: 1,
    marginRight: 30,
    // maxWidth: '70%',
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
  category: {
    color: 'white',
    paddingVertical: 3,
    paddingBottom: 5,
    paddingHorizontal: 8,
    borderRadius: 50,
    fontSize: 14,
  },
  paidPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.green,
    marginRight: 2,
  },
  regularPrice: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  date: {
    fontSize: 14,
    color: '#adadad',
    marginLeft: 10,
  },
  wears: {
    fontSize: 14,
    color: '#adadad',
  },
  footer: {
    padding: 8,
    alignItems: 'center',
  },
  footerText: {
    color: 'gray',
  },
  placeholder: {
    backgroundColor: 'lightgrey',
    width: '98%',
    height: 80,
    marginHorizontal: 4,
    marginBottom: 2,
    borderRadius: 10,
  },
  loadingIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 10,
  },
});

export default PurchaseList;
