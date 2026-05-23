import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import CustomButton from './button';
import { useTheme } from '../theme/themeContext';
import AddButton from './addButton';
import CustomInput from './customInput';
import CategoryPickerSheet from './categoryPickerSheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from './header';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases, setCurrentPurchase } from '../redux/actions/purchaseActions';
import uuid from 'react-native-uuid';
import {
  generateFirestoreTimestamp,
  generateFirestoreTimestampFromDate,
  timestampToDate,
} from '../utils/date';
import CustomCategorySheet from './customCategorySheet';
import { setCategories } from '../redux/actions/userActions';
import { convertCentsToDollars, convertDollarsToCents } from '../utils/price';
import Banner from './banner';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useNavigation } from '@react-navigation/native';

dayjs.extend(utc);

const DEFAULT_WEAR_GOAL = 10;

const PurchaseForm = ({ purchase, name, date, edit }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase.purchases);
  const categories = useSelector((state) => state.user.categories);
  const tabBarHeight = useBottomTabBarHeight();

  const navigation = useNavigation();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const formattedDate = selectedDate ? dayjs.utc(selectedDate).format('ddd, MMM D') : null;
  const [open, setOpen] = useState(false);
  const [regularPrice, setRegularPrice] = useState(null);
  const [paidPrice, setPaidPrice] = useState(null);
  const [wearGoal, setWearGoal] = useState('');
  const [note, setNote] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);

  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [customSubcategoryName, setCustomSubcategoryName] = useState('');

  const [banner, setBanner] = useState(null);
  const selectedCategoryText = category?.category || category || 'Category';

  const showBanner = (message, type = 'error', onPress = null) => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type, onPress });
    }, 10);
  };

  useEffect(() => {
    if (purchase) {
      setItemName(purchase.name);
      setCategory(purchase.category);
      setSelectedDate(timestampToDate(purchase.datePurchased));
      setRegularPrice(
        purchase.regularPrice != null ? convertCentsToDollars(purchase.regularPrice) : null
      );
      setPaidPrice(convertCentsToDollars(purchase.paidPrice));
      setWearGoal(purchase.wearGoal != null ? String(purchase.wearGoal) : '');
      setNote(purchase.note);
      setDisabled(purchase.paidPrice ? true : false);
    }
    if (name) {
      setItemName(name);
    } else if (name === null) {
      setItemName('');
    }
    if (date) {
      setSelectedDate(dayjs(date + 'T12:00:00').toDate());
    }
  }, [purchase, name, date]);

  useFocusEffect(
    useCallback(() => {
      setBanner(null);
    }, [])
  );

  useEffect(() => {
    const checkFields = () => {
      return (
        itemName !== '' ||
        category !== null ||
        regularPrice !== null ||
        paidPrice !== null ||
        wearGoal !== '' ||
        note !== null
      );
    };
    setShowClearButton(checkFields());
  }, [itemName, category, regularPrice, paidPrice, wearGoal, note]);

  const handleSelect = (selectedValue) => {
    setCategory(selectedValue);
  };

  const removeRegularPrice = () => {
    setDisabled(false);
    setRegularPrice(null);
  };

  const validatePrice = (price) => /^\d+(\.\d{1,2})?$/.test(price);
  const validateName = (name) => /^(?=.*[A-Za-z0-9]).+$/.test(name);
  const validateWearGoal = (goal) => /^\d+$/.test(goal) && parseInt(goal, 10) > 0;
  const savedWearGoal = wearGoal ? parseInt(wearGoal, 10) : DEFAULT_WEAR_GOAL;

  const validateFields = () => {
    if (!validateName(itemName) || paidPrice === '') {
      showBanner('Please fill in all missing fields');
      return false;
    }
    if (!validatePrice(paidPrice) || (regularPrice && !validatePrice(regularPrice))) {
      showBanner('Prices must be a valid number with up to 2 decimal places');
      return false;
    }
    if (paidPrice && regularPrice && parseFloat(paidPrice) >= parseFloat(regularPrice)) {
      showBanner('Paid price must be less than regular price');
      return false;
    }
    if (wearGoal && !validateWearGoal(wearGoal)) {
      showBanner('Wear goal must be a whole number greater than 0');
      return false;
    }
    return true;
  };

  const mergeCategory = (categories, newItem) => {
    const updated = [...categories];
    const match = updated.find((c) => c.name === newItem.category);
    if (!match) {
      updated.push({
        id: newItem.id,
        name: newItem.category,
        custom: true,
        subCategories: [],
      });
    }
    return updated;
  };

  const updatePurchaseInArray = (purchase) =>
    purchases.map((p) => (p.key === purchase.key ? purchase : p));

  const updatePurchase = async () => {
    if (!validateFields()) return;

    try {
      const userRef = firestore().collection('users').doc(auth().currentUser.uid);
      const updatedPurchase = {
        key: purchase.key,
        name: itemName,
        wears: purchase.wears,
        category: category || null,
        note: note,
        edited: generateFirestoreTimestamp(),
        regularPrice: regularPrice ? Math.round(parseFloat(regularPrice) * 100) : null,
        paidPrice: Math.round(parseFloat(paidPrice) * 100),
        wearGoal: savedWearGoal,
        datePurchased: selectedDate ? generateFirestoreTimestampFromDate(selectedDate) : null,
        dateCreated: purchase.dateCreated,
      };
      await userRef.collection('Purchases').doc(purchase.key).update(updatedPurchase);
      dispatch(setCurrentPurchase(updatedPurchase));
      dispatch(setPurchases(updatePurchaseInArray(updatedPurchase)));
      showBanner('Item updated successfully!', 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating purchase: ', error);
      showBanner('An error occurred while updating the purchase.');
    }
  };

  const addPurchase = async () => {
    if (!validateFields()) return;

    try {
      const userRef = firestore().collection('users').doc(auth().currentUser.uid);
      const id = uuid.v4();
      const newPurchase = {
        key: id,
        name: itemName,
        category: category || null,
        note: note,
        wears: [],
        regularPrice: regularPrice ? convertDollarsToCents(regularPrice) : null,
        paidPrice: paidPrice ? convertDollarsToCents(paidPrice) : 0,
        wearGoal: savedWearGoal,
        datePurchased: selectedDate ? generateFirestoreTimestampFromDate(selectedDate) : null,
        dateCreated: generateFirestoreTimestamp(),
      };
      await userRef.collection('Purchases').doc(id).set(newPurchase);
      dispatch(setPurchases([newPurchase, ...purchases]));
      resetFields();

      showBanner('Purchase added! Tap to view.', 'success', () => {
        dispatch(setCurrentPurchase(newPurchase));
        navigation.navigate('Purchases', {
          screen: 'ItemsScreen',
        });
        setTimeout(() => {
          dispatch(setCurrentPurchase(newPurchase));
          navigation.navigate('Details');
        }, 10);
      });
    } catch (error) {
      console.error('Error adding purchase: ', error);
      showBanner('An error occurred while adding the purchase.');
    }
  };

  const handleSubmit = () => {
    if (edit) {
      updatePurchase();
    } else {
      addPurchase();
    }
  };

  const resetFields = () => {
    setItemName('');
    setCategory(null);
    setNote(null);
    setRegularPrice(null);
    setPaidPrice(null);
    setWearGoal('');
    setSelectedDate(null);
  };

  return (
    <View style={styles.screen}>
      <Header title={edit ? `Edit ${purchase.name}` : 'Add Item'} />

      {banner && (
        <Banner
          message={banner.message}
          type={banner.type}
          onPress={banner.onPress}
          onFinish={() => setBanner(null)}
        />
      )}

      <KeyboardAvoidingView style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Item details</Text>
              <CustomInput placeholder="Item name" value={itemName} onChangeText={setItemName} />
              <CustomInput
                placeholder="Price"
                value={paidPrice}
                onChangeText={setPaidPrice}
                type="numeric"
                prefix="$"
                component={<AddButton onPress={() => setDisabled(true)} disabled={disabled} />}
              />

              {disabled && (
                <CustomInput
                  placeholder="Enter regular price (optional)"
                  value={regularPrice}
                  onChangeText={setRegularPrice}
                  type="numeric"
                  prefix="$"
                  component={
                    <TouchableWithoutFeedback onPress={removeRegularPrice}>
                      <Ionicons
                        style={styles.icon}
                        name="remove-outline"
                        size={16}
                        color={colors.gray}
                      />
                    </TouchableWithoutFeedback>
                  }
                />
              )}

              <CustomInput
                placeholder={`Wear goal (default ${DEFAULT_WEAR_GOAL})`}
                value={wearGoal}
                onChangeText={setWearGoal}
                type="numeric"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Other details (optional)</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategorySheet(true)}
              >
                <View style={styles.categoryContent}>
                  <View style={styles.categoryIcon}>
                    <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.categoryText, { color: category ? colors.black : colors.gray }]}
                  >
                    {selectedCategoryText}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray} />
              </TouchableOpacity>
              <View>
                <TouchableOpacity onPress={() => setOpen(true)} style={styles.dateBtn}>
                  <View style={styles.dateContent}>
                    <Ionicons name={'calendar'} size={20} color={colors.primary} />
                    <Text style={[styles.text, !selectedDate && styles.placeholderText]}>
                      {formattedDate || 'Date purchased'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.gray} />
                </TouchableOpacity>
              </View>
              <DatePicker
                modal
                open={open}
                date={selectedDate || new Date()}
                onConfirm={(date) => {
                  setOpen(false);
                  setSelectedDate(date);
                }}
                onCancel={() => setOpen(false)}
                mode={'date'}
              />
              <CustomInput placeholder="Notes" value={note} onChangeText={setNote} multiline />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.actionArea, { paddingBottom: tabBarHeight + 12 }]}>
          {showClearButton && !edit && (
            <TouchableOpacity style={styles.clearBtn} onPress={resetFields}>
              <Text style={styles.clear}>Clear all</Text>
            </TouchableOpacity>
          )}

          <CustomButton
            buttonStyle={styles.submitBtn}
            onPress={handleSubmit}
            title={edit ? 'Update item' : 'Save item'}
          />
        </View>
      </KeyboardAvoidingView>

      <CustomCategorySheet
        visible={showCustomSheet}
        onClose={() => setShowCustomSheet(false)}
        items={categories}
        initialSubcategoryName={customSubcategoryName}
        onSave={(newItem, wasAdded) => {
          const updated = mergeCategory(categories, newItem);
          dispatch(setCategories(updated));
          setCategory(newItem);
          setShowCustomSheet(false);
          showBanner(wasAdded ? 'Custom category added!' : 'Category already exists.', 'success');
        }}
      />
      <CategoryPickerSheet
        visible={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        items={categories}
        onSelect={handleSelect}
        setSelectedItem={setCategory}
        onOpenCustomSheet={(searchValue) => {
          setCustomSubcategoryName(searchValue);
          setShowCustomSheet(true);
        }}
      />
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.white,
    },
    keyboardView: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
    formCard: {
      width: '100%',
      gap: 18,
    },
    section: {
      gap: 10,
    },
    sectionTitle: {
      color: colors.gray,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    submitBtn: {
      borderRadius: 10,
    },
    icon: {
      padding: 8,
      borderRadius: 50,
    },
    actionArea: {
      width: '100%',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.lightestGrey,
    },
    clearBtn: {
      alignSelf: 'flex-end',
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    clear: {
      color: colors.primary,
      fontWeight: '600',
    },
    dateBtn: {
      width: '100%',
      backgroundColor: colors.white,
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.lightGrey,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categorySelector: {
      width: '100%',
      backgroundColor: colors.white,
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.lightGrey,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    categoryIcon: {
      width: 20,
      alignItems: 'center',
      marginRight: 10,
    },
    categoryText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
    },
    dateContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    text: {
      color: colors.black,
      fontSize: 15,
    },
    placeholderText: {
      color: colors.gray,
    },
  });

export default PurchaseForm;
