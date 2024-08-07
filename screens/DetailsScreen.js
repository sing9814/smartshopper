import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import colors from '../utils/colors';
import CustomButton from '../components/button';
import { deletePurchase } from '../utils/firebase';
import ConfirmationModal from '../components/confirmationModal';
import { formatDate, formatTimeStamp } from '../utils/date';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import PigSVG from '../assets/pigSVG';
import MoneySVG from '../assets/moneySVG';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DetailsScreen = ({ route, navigation }) => {
  const { purchase } = route.params;

  const [errorMessage, setErrorMessage] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = () => {
    deletePurchase(purchase.key);
    navigation.goBack();
  };

  const onPressDelete = () => {
    setModalVisible(true);
  };

  const displayCategoryName = (purchase) => {
    if (purchase.subCategory) {
      const akaIndex = purchase.subCategory.toLowerCase().indexOf('aka');
      if (akaIndex !== -1) {
        return `${purchase.category} - ${purchase.subCategory.substring(0, akaIndex)}`;
      }
      return `${purchase.category} - ${purchase.subCategory}`;
    }
    return purchase.category;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={30} color={colors.primary} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => navigation.navigate('Edit', { purchase })}>
          <FontAwesome name="pencil" size={26} color={colors.primary} />
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.textContainer}>
        <View style={styles.listContainer}>
          <View style={[styles.row, { alignItems: 'flex-start' }]}>
            <Text style={styles.title}>{purchase.name}</Text>

            <Text style={styles.date}>{formatDate(purchase.datePurchased)}</Text>
          </View>
          <View style={styles.row}>
            {purchase.category?.category && (
              <View>
                <Text
                  style={[
                    styles.category,
                    { backgroundColor: colors[purchase.category?.category.split(' ')[0]] },
                  ]}
                >
                  {displayCategoryName(purchase.category)}
                </Text>
              </View>
            )}
            <View style={styles.group}>
              <Text style={styles.paidPrice}>${purchase.paidPrice || purchase.regularPrice}</Text>
              {purchase.paidPrice && (
                <Text style={styles.regularPrice}>${purchase.regularPrice}</Text>
              )}
            </View>
          </View>
          <Text style={styles.note}>{purchase.note || '(no note)'}</Text>
        </View>
        <View style={styles.amtContainer}>
          <View style={styles.card}>
            <MoneySVG size={40} />
            <View>
              <Text style={styles.amtHeader}>Spent</Text>
              <Text style={styles.amount}>${purchase.paidPrice || purchase.regularPrice}</Text>
            </View>
          </View>
          <View style={styles.card}>
            <PigSVG size={40} />
            <View>
              <Text style={styles.amtHeader}>Saved</Text>
              <Text style={styles.amount}>
                ${purchase.paidPrice ? purchase.regularPrice - purchase.paidPrice : '0'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.details}>Date created: {formatTimeStamp(purchase.dateCreated)}</Text>
      {purchase.edited && (
        <Text style={styles.details}>Last edited: {formatTimeStamp(purchase.edited)}</Text>
      )}
      <CustomButton buttonStyle={styles.button} onPress={onPressDelete} title="Delete" />
      <ConfirmationModal
        data={purchase.name}
        visible={modalVisible}
        onConfirm={handleDelete}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.bg,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  text: {
    color: 'black',
  },
  listContainer: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 12,
    borderBottomColor: colors.bg,
    borderRadius: 10,
    gap: 8,
    paddingBottom: 18,
  },
  title: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 24,
    flexShrink: 1,
    marginRight: 16,
  },
  note: {
    color: 'gray',
    lineHeight: 22,
  },
  textContainer: {
    flex: 1,
    gap: 12,
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
    fontSize: 13,
    color: '#adadad',
    marginTop: 6,
    marginBottom: 8,
  },
  details: {
    fontSize: 13,
    color: '#919191',
    marginBottom: 8,
  },
  card: {
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
    flexDirection: 'row',
    flexGrow: 1,
    margin: 4,
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  amtContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderRadius: 10,
    gap: 12,
  },
  amtHeader: {
    color: colors.black,
    fontSize: 13,
    marginBottom: 2,
  },
  amount: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  amtTitle: {
    color: colors.black,
    fontSize: 16,
  },
});

export default DetailsScreen;
