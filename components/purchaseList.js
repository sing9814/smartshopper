import React from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../utils/colors';
import { formatDateShort } from '../utils/date';

const PurchaseList = ({
  purchases,
  refreshing,
  onRefresh,
  onItemPress,
  onItemLongPress,
  overlay,
}) => {
  const renderFooter = () => (
    <View style={{ padding: 8, alignItems: 'center' }}>
      <Text style={styles.note}>No more data to show</Text>
    </View>
  );

  const displayCategoryName = (item) => {
    if (item?.subCategory) {
      const akaIndex = item.subCategory.toLowerCase().indexOf('aka');
      if (akaIndex !== -1) {
        return item.subCategory.substring(0, akaIndex);
      }
      return item.subCategory;
    }
    return item.category;
  };

  return (
    <View style={styles.container}>
      {purchases.length > 0 ? (
        <FlatList
          data={purchases}
          contentContainerStyle={styles.list}
          ListFooterComponent={renderFooter}
          refreshControl={
            onRefresh && <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onItemPress(item)}
              onLongPress={() => onItemLongPress(item)}
              style={styles.listContainer}
            >
              <View style={styles.textContainer}>
                <View style={styles.row}>
                  <View style={styles.group}>
                    <Text style={styles.title}>{item.name}</Text>
                    {item.category?.category && (
                      <Text
                        style={[
                          styles.category,
                          { backgroundColor: colors[item.category?.category.split(' ')[0]] },
                        ]}
                      >
                        {displayCategoryName(item.category)}
                      </Text>
                    )}
                    {!overlay && <Text style={styles.date}>• {item.wears + ' wears'}</Text>}
                  </View>
                  <Text style={styles.date}>
                    {overlay ? item.wears + ' wears' : formatDateShort(item.datePurchased)}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text numberOfLines={1} style={styles.note}>
                    {item.note || '(no note)'}
                  </Text>

                  <View style={styles.group}>
                    <Text style={styles.paidPrice}>${item.paidPrice || item.regularPrice}</Text>
                    {item.paidPrice && (
                      <Text style={styles.regularPrice}>${item.regularPrice}</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={{ padding: 8, alignItems: 'center' }}>
          <Text style={styles.note}>No data to show</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 65,
    flexGrow: 0,
    marginHorizontal: 4,
  },
  container: {
    flex: 1,
  },
  listContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 10,
    borderBottomColor: colors.bg,
    marginBottom: 2,
    borderRadius: 10,
  },
  title: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 16,
  },
  note: {
    color: 'gray',
    maxWidth: '80%',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  group: {
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
  },
});

export default PurchaseList;
