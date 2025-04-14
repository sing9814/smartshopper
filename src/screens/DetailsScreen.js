import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../theme/themeContext';
import CustomButton from '../components/button';
import { deletePurchase } from '../utils/firebase';
import ConfirmationModal from '../components/confirmationModal';
import { formatDate, formatTimeStamp, formatTimeStampNoTime } from '../utils/date';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases, setCurrentPurchase } from '../redux/actions/purchaseActions';
import ConfirmationPopup from '../components/confirmationPopup';
import { generateFirestoreTimestamp } from '../utils/date';
import { updatePurchaseWears } from '../utils/firebase';
import DetailsSheet from '../components/detailsSheet';

const DetailsScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch();

  const purchases = useSelector((state) => state.purchase.purchases);
  const currentPurchase = useSelector((state) => state.purchase.currentPurchase);

  const [errorMessage, setErrorMessage] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [isSheetVisible, setIsSheetVisible] = useState(false);

  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation]);

  const handleDelete = () => {
    deletePurchase(currentPurchase.key);
    const updatedPurchaseList = purchases.filter((p) => p.key !== currentPurchase.key);
    dispatch(setPurchases(updatedPurchaseList));

    navigation.goBack();
  };

  const onPressAddWear = async () => {
    const date = generateFirestoreTimestamp();

    const newWears = [...(currentPurchase.wears || []), date];
    console.log(newWears);

    const updatedPurchases = purchases.map((purchase) =>
      purchase.key === currentPurchase.key ? { ...purchase, wears: newWears } : purchase
    );
    dispatch(setPurchases(updatedPurchases));
    dispatch(setCurrentPurchase({ ...currentPurchase, wears: newWears }));

    await updatePurchaseWears(currentPurchase.key, newWears);
    setShowConfirmation(true);
  };

  const displayCategoryName = (purchase) => {
    if (purchase.subCategory.name) {
      const akaIndex = purchase.subCategory.name.toLowerCase().indexOf('aka');
      if (akaIndex !== -1) {
        return `${purchase.category} - ${purchase.subCategory.name.substring(0, akaIndex)}`;
      }
      return `${purchase.category} - ${purchase.subCategory.name}`;
    }
    return purchase.category;
  };

  return (
    <View style={styles.container}>
      {showConfirmation && <ConfirmationPopup message={`Wear added successfully!`} />}

      <View style={styles.topbar}>
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => setIsSheetVisible(true)}>
          <FontAwesome6 name="ellipsis" size={26} color="white" />
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.paddingContainer}>
        <View style={styles.topContainer}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.title}>{currentPurchase.name}</Text>
            </View>

            <View style={styles.alignRight}>
              <Text style={styles.label}>Price</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.paidPrice}>
                  ${currentPurchase.paidPrice || currentPurchase.regularPrice}
                </Text>
                {currentPurchase.paidPrice && (
                  <Text style={styles.regularPrice}>${currentPurchase.regularPrice}</Text>
                )}
              </View>
            </View>
          </View>

          <View>
            <Text style={styles.label}>Category</Text>
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
            </View>
          </View>

          <View>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.note}>{currentPurchase.note || '(no note)'}</Text>
          </View>

          <View style={styles.line}></View>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Condition</Text>
              <Text style={styles.text}>Slightly worn</Text>
            </View>

            <View style={styles.alignRight}>
              <Text style={styles.label}>Wear count</Text>
              <Text style={styles.text}>{currentPurchase.wears.length}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Last worn</Text>
              <Text style={styles.text}>
                {formatTimeStampNoTime(currentPurchase.wears[currentPurchase.wears.length - 1])}
              </Text>
            </View>

            <View style={styles.alignRight}>
              <Text style={styles.label}>Cost per wear (CPW)</Text>
              <Text style={styles.text}>
                $
                {currentPurchase.wears.length > 0
                  ? (
                      (currentPurchase.paidPrice || currentPurchase.regularPrice) /
                      currentPurchase.wears.length
                    ).toFixed(2)
                  : 'N/A'}
              </Text>
            </View>
          </View>

          <CustomButton buttonStyle={styles.button} onPress={onPressAddWear} title="Add wear" />
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.label}>Purchased: {formatDate(currentPurchase.datePurchased)}</Text>
          <Text style={styles.label}>Created: {formatTimeStamp(currentPurchase.dateCreated)}</Text>
          {currentPurchase.edited && (
            <Text style={styles.label}>Last edited: {formatTimeStamp(currentPurchase.edited)}</Text>
          )}
        </View>

        <ConfirmationModal
          data={currentPurchase.name}
          visible={modalVisible}
          onConfirm={handleDelete}
          onCancel={() => setModalVisible(false)}
        />
      </View>

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

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    paddingContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    alignRight: {
      alignItems: 'flex-end',
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
      paddingTop: 15,
      paddingBottom: 20,
      paddingHorizontal: 20,
      marginBottom: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    text: {
      color: colors.black,
      fontWeight: 'bold',
    },
    title: {
      color: colors.black,
      fontWeight: '700',
      fontSize: 24,
      flexShrink: 1,
      marginRight: 16,
    },
    note: {
      color: colors.black,
      lineHeight: 22,
      backgroundColor: colors.bg,
      padding: 16,
      borderRadius: 10,
    },
    topContainer: {
      gap: 12,
    },
    priceContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    category: {
      color: colors.white,
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
    },
    regularPrice: {
      textDecorationLine: 'line-through',
      color: colors.gray,
      marginLeft: 2,
    },
    line: {
      width: '100%',
      height: 1,
      backgroundColor: colors.lightGrey,
      opacity: 0.5,
      marginVertical: 10,
      borderRadius: 10,
    },
    bottomContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      marginBottom: 16,
      gap: 4,
    },
    button: {
      marginTop: 10,
    },
  });

export default DetailsScreen;
