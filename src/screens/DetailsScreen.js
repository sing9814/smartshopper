import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import colors from '../utils/colors';
import CustomButton from '../components/button';
import { deletePurchase } from '../utils/firebase';
import ConfirmationModal from '../components/confirmationModal';
import { formatDate, formatTimeStamp, formatTimeStampNoTime } from '../utils/date';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import PigSVG from '../../assets/pigSVG';
import MoneySVG from '../../assets/moneySVG';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases } from '../redux/actions/purchaseActions';

const DetailsScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const purchases = useSelector((state) => state.purchase.purchases);
  const currentPurchase = useSelector((state) => state.purchase.currentPurchase);

  const [errorMessage, setErrorMessage] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = () => {
    deletePurchase(currentPurchase.key);
    const updatedPurchaseList = purchases.filter((p) => p.key !== currentPurchase.key);
    dispatch(setPurchases(updatedPurchaseList));

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

  // console.log(
  //   currentPurchase.regularPrice,
  //   currentPurchase.wears.length,
  //   (
  //     currentPurchase.paidPrice || currentPurchase.regularPrice / currentPurchase.wears.length
  //   ).toFixed(0)
  // );

  // {currentPurchase.wears.length > 0
  //   ? currentPurchase.paidPrice ||
  //     currentPurchase.regularPrice / currentPurchase.wears.length
  //   : 'N/A'}

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={30} color={colors.primary} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          onPress={() => navigation.navigate('Edit', { purchase: currentPurchase })}
        >
          <FontAwesome name="pencil" size={26} color={colors.primary} />
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.textContainer}>
        <View style={styles.listContainer}>
          <View style={[styles.row, { alignItems: 'flex-start' }]}>
            <Text style={styles.title}>{currentPurchase.name}</Text>

            <Text style={styles.date}>{formatDate(currentPurchase.datePurchased)}</Text>
          </View>
          <View style={styles.row}>
            {currentPurchase.category?.category && (
              <View>
                <Text
                  style={[
                    styles.category,
                    { backgroundColor: colors[currentPurchase.category?.category.split(' ')[0]] },
                  ]}
                >
                  {displayCategoryName(currentPurchase.category)}
                </Text>
              </View>
            )}
            <View style={styles.group}>
              <Text style={styles.paidPrice}>
                ${currentPurchase.paidPrice || currentPurchase.regularPrice}
              </Text>
              {currentPurchase.paidPrice && (
                <Text style={styles.regularPrice}>${currentPurchase.regularPrice}</Text>
              )}
            </View>
          </View>
          <Text style={styles.note}>{currentPurchase.note || '(no note)'}</Text>
        </View>
        <View style={styles.amtContainer}>
          <View style={styles.card}>
            <MoneySVG size={40} />
            <View>
              <Text style={styles.amtHeader}>Spent</Text>
              <Text style={styles.amount}>
                ${currentPurchase.paidPrice || currentPurchase.regularPrice}
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <PigSVG size={40} />
            <View>
              <Text style={styles.amtHeader}>Saved</Text>
              <Text style={styles.amount}>
                $
                {currentPurchase.paidPrice
                  ? currentPurchase.regularPrice - currentPurchase.paidPrice
                  : '0'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.listContainer}>
          <View style={[styles.row, { alignItems: 'flex-start' }]}>
            <Text style={styles.title}>{currentPurchase.wears.length} wears</Text>
            <Text style={styles.paidPrice}>
              CPW $
              {currentPurchase.wears.length > 0
                ? (
                    (currentPurchase.paidPrice || currentPurchase.regularPrice) /
                    currentPurchase.wears.length
                  ).toFixed(2)
                : 'N/A'}
            </Text>
          </View>

          <Text style={styles.note}>
            Last worn:{' '}
            {formatTimeStampNoTime(currentPurchase.wears[currentPurchase.wears.length - 1])}
          </Text>
          <CustomButton buttonStyle={styles.button} onPress={onPressDelete} title="Add wear" />
        </View>
      </View>

      <Text style={styles.details}>Created: {formatTimeStamp(currentPurchase.dateCreated)}</Text>
      {currentPurchase.edited && (
        <Text style={styles.details}>Last edited: {formatTimeStamp(currentPurchase.edited)}</Text>
      )}
      <CustomButton buttonStyle={styles.button} onPress={onPressDelete} title="Delete" />
      <ConfirmationModal
        data={currentPurchase.name}
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
