import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import CustomButton from './button';
import { useTheme } from '../theme/themeContext';
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
import {
  convertCentsToDollars,
  convertDollarsToCents,
  getLocalCurrencySymbol,
} from '../utils/price';
import Banner from './banner';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useNavigation } from '@react-navigation/native';
import { getCurrentItemColor, getItemColorBorder } from '../utils/itemColor';

dayjs.extend(utc);

const DEFAULT_WEAR_GOAL = 10;
const WEAR_GOAL_PRESETS = [10, 30, 50, 100];

const titleCaseName = (value) => value.replace(/\b\w/g, (char) => char.toUpperCase());

const getSuggestedItemName = (category, color) => {
  const categoryName = category?.subCategory?.name;
  if (!categoryName) return '';

  const itemTypeName = titleCaseName(categoryName);
  return color ? `${color.name} ${itemTypeName}` : itemTypeName;
};

const PurchaseForm = ({ purchase, name, date, edit }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase.purchases);
  const categories = useSelector((state) => state.user.categories);
  const tabBarHeight = useBottomTabBarHeight();

  const navigation = useNavigation();

  const [itemName, setItemName] = useState('');
  const [dismissedSuggestedName, setDismissedSuggestedName] = useState('');
  const [appliedSuggestedName, setAppliedSuggestedName] = useState('');
  const [category, setCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const formattedDate = selectedDate ? dayjs.utc(selectedDate).format('ddd, MMM D') : null;
  const [open, setOpen] = useState(false);
  const [paidPrice, setPaidPrice] = useState(null);
  const [wearGoal, setWearGoal] = useState(String(DEFAULT_WEAR_GOAL));
  const [customWearGoal, setCustomWearGoal] = useState(false);
  const [itemColor, setItemColor] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [note, setNote] = useState(null);
  const [showClearButton, setShowClearButton] = useState(false);

  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [customSubcategoryName, setCustomSubcategoryName] = useState('');

  const [banner, setBanner] = useState(null);
  const selectedCategoryText = category?.subCategory?.name
    ? `${category.category} - ${category.subCategory.name}`
    : category?.category || category || 'Category';
  const currencySymbol = getLocalCurrencySymbol();
  const displayItemColor = getCurrentItemColor(itemColor, colors);

  const suggestedName = getSuggestedItemName(category, itemColor);
  const showNameSuggestion =
    suggestedName &&
    itemName !== suggestedName &&
    dismissedSuggestedName !== suggestedName &&
    appliedSuggestedName !== suggestedName;

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
      setPaidPrice(purchase.paidPrice != null ? convertCentsToDollars(purchase.paidPrice) : null);
      const purchaseWearGoal = Number(purchase.wearGoal ?? DEFAULT_WEAR_GOAL);
      setWearGoal(String(purchaseWearGoal));
      setCustomWearGoal(!WEAR_GOAL_PRESETS.includes(purchaseWearGoal));
      setItemColor(purchase.itemColor || null);
      setNote(purchase.note);
    }
    if (name) {
      setItemName(name);
      setDismissedSuggestedName('');
      setAppliedSuggestedName('');
    } else if (name === null) {
      setItemName('');
      setDismissedSuggestedName('');
      setAppliedSuggestedName('');
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
        paidPrice !== null ||
        wearGoal !== String(DEFAULT_WEAR_GOAL) ||
        itemColor !== null ||
        note !== null
      );
    };
    setShowClearButton(checkFields());
  }, [itemName, category, paidPrice, wearGoal, itemColor, note]);

  const handleSelect = (selectedValue) => {
    setCategory(selectedValue);
  };

  const validatePrice = (price) => /^\d+(\.\d{1,2})?$/.test(price);
  const validateName = (name) => /^(?=.*[A-Za-z0-9]).+$/.test(name);
  const validateWearGoal = (goal) => /^\d+$/.test(goal) && parseInt(goal, 10) > 0;
  const savedWearGoal = wearGoal ? parseInt(wearGoal, 10) : DEFAULT_WEAR_GOAL;

  const validateFields = () => {
    if (!category) {
      showBanner('Please choose a category');
      return false;
    }
    if (!itemColor) {
      showBanner('Please choose a color');
      return false;
    }
    if (!validateName(itemName)) {
      showBanner('Please enter an item name');
      return false;
    }
    if (paidPrice && !validatePrice(paidPrice)) {
      showBanner('Price must be a valid number with up to 2 decimal places');
      return false;
    }
    if ((customWearGoal && !wearGoal) || (wearGoal && !validateWearGoal(wearGoal))) {
      showBanner('Wear goal must be a whole number greater than 0');
      return false;
    }
    return true;
  };

  const mergeCategory = (categories, newItem) => {
    return categories.map((cat) => {
      const subCategories = (cat.subCategories || []).filter((sub) => sub.id !== newItem.id);

      if (cat.name !== newItem.category) {
        return {
          ...cat,
          subCategories,
        };
      }

      return {
        ...cat,
        subCategories: [...subCategories, newItem.subCategory],
      };
    });
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
        regularPrice: purchase.regularPrice ?? null,
        paidPrice: paidPrice ? Math.round(parseFloat(paidPrice) * 100) : null,
        wearGoal: savedWearGoal,
        itemColor,
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
        regularPrice: null,
        paidPrice: paidPrice ? convertDollarsToCents(paidPrice) : null,
        wearGoal: savedWearGoal,
        itemColor,
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
    setDismissedSuggestedName('');
    setAppliedSuggestedName('');
    setCategory(null);
    setNote(null);
    setPaidPrice(null);
    setWearGoal(String(DEFAULT_WEAR_GOAL));
    setCustomWearGoal(false);
    setItemColor(null);
    setColorPickerOpen(false);
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
              <View style={styles.categoryColorRow}>
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
                      style={[
                        styles.categoryText,
                        { color: category ? colors.black : colors.placeholder },
                      ]}
                    >
                      {selectedCategoryText}
                    </Text>
                  </View>
                  <Ionicons
                    name={showCategorySheet ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.gray}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.colorSelector}
                  onPress={() => setColorPickerOpen((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel="Choose item color"
                >
                  {displayItemColor ? (
                    <View
                      style={[
                        styles.colorSelectorSwatch,
                        {
                          backgroundColor: displayItemColor.hex,
                          borderColor: getItemColorBorder(displayItemColor, colors),
                        },
                      ]}
                    />
                  ) : (
                    <View style={styles.noColorSwatch}>
                      <View style={styles.noColorSlash} />
                    </View>
                  )}
                  <Ionicons
                    name={colorPickerOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>

              {colorPickerOpen && (
                <View style={styles.colorOptions}>
                  {colors.itemColorOptions.map((option) => {
                    const isSelected = itemColor?.name === option.name;

                    return (
                      <TouchableOpacity
                        key={option.name}
                        style={[styles.colorOption, isSelected && styles.colorOptionSelected]}
                        onPress={() => {
                          setItemColor(option);
                          setColorPickerOpen(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${option.name} color`}
                      >
                        <View
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: option.hex,
                              borderColor:
                                option.name === 'White' || option.name === 'Black'
                                  ? colors.gray
                                  : option.hex,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.colorOptionText,
                            isSelected && styles.colorOptionTextSelected,
                          ]}
                        >
                          {option.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <CustomInput
                placeholder="Item name"
                value={itemName}
                onChangeText={setItemName}
                component={
                  showNameSuggestion && (
                    <View style={styles.nameSuggestion}>
                      <TouchableOpacity
                        style={styles.nameSuggestionApply}
                        onPress={() => {
                          setItemName(suggestedName);
                          setAppliedSuggestedName(suggestedName);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Use suggested name ${suggestedName}`}
                      >
                        <Text style={styles.nameSuggestionLabel} numberOfLines={1}>
                          {suggestedName}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.nameSuggestionDismiss}
                        onPress={() => setDismissedSuggestedName(suggestedName)}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss suggested name"
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={13} color={colors.gray} />
                      </TouchableOpacity>
                    </View>
                  )
                }
              />

              <View style={styles.wearGoalField}>
                <Text style={styles.sectionTitle}>Wear goal</Text>
                <View style={styles.wearGoalOptions}>
                  {WEAR_GOAL_PRESETS.map((goal) => {
                    const selected = !customWearGoal && wearGoal === String(goal);

                    return (
                      <TouchableOpacity
                        key={goal}
                        style={[styles.wearGoalOption, selected && styles.wearGoalOptionSelected]}
                        onPress={() => {
                          setWearGoal(String(goal));
                          setCustomWearGoal(false);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.wearGoalOptionText,
                            selected && styles.wearGoalOptionTextSelected,
                          ]}
                        >
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.wearGoalOption, customWearGoal && styles.wearGoalOptionSelected]}
                    onPress={() => {
                      if (!customWearGoal) setWearGoal('');
                      setCustomWearGoal(true);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: customWearGoal }}
                  >
                    <Text
                      style={[
                        styles.wearGoalOptionText,
                        customWearGoal && styles.wearGoalOptionTextSelected,
                      ]}
                    >
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>
                {customWearGoal && (
                  <CustomInput
                    placeholder="Custom wear goal"
                    value={wearGoal}
                    onChangeText={setWearGoal}
                    type="numeric"
                  />
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Optional details</Text>
              <CustomInput
                placeholder="Price (for cost per wear)"
                value={paidPrice}
                onChangeText={setPaidPrice}
                type="numeric"
                prefix={currencySymbol}
              />
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
              <Text style={styles.clear}>Reset form</Text>
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
          showBanner(
            wasAdded ? 'Custom subcategory added!' : 'Subcategory already exists.',
            'success'
          );
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
      fontSize: 13,
      marginBottom: 2,
      marginTop: -6,
    },
    categoryColorRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    colorSelector: {
      width: 64,
      backgroundColor: colors.white,
      minHeight: 52,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.lightGrey,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    colorSelectorSwatch: {
      width: 18,
      height: 18,
      borderRadius: 10,
      borderWidth: 1,
    },
    noColorSwatch: {
      width: 18,
      height: 18,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.gray,
      backgroundColor: colors.white,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    noColorSlash: {
      width: 26,
      height: 1,
      backgroundColor: colors.gray,
      transform: [{ rotate: '-45deg' }],
    },
    colorOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    colorOption: {
      minHeight: 34,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.lightGrey,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.white,
    },
    colorOptionSelected: {
      borderColor: colors.primary,
    },
    colorSwatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
    },
    colorOptionText: {
      color: colors.black,
    },
    colorOptionTextSelected: {
      color: colors.primary,
    },
    nameSuggestion: {
      maxWidth: 170,
      minHeight: 28,
      paddingVertical: 6,
      paddingLeft: 9,
      paddingRight: 4,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.lightGrey,
      backgroundColor: colors.bg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 8,
    },
    nameSuggestionApply: {
      flexShrink: 1,
    },
    nameSuggestionLabel: {
      color: colors.black,
      fontSize: 13,
      flexShrink: 1,
    },
    nameSuggestionDismiss: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wearGoalField: {
      gap: 10,
      paddingTop: 8,
    },
    wearGoalOptions: {
      flexDirection: 'row',
      gap: 6,
    },
    wearGoalOption: {
      flex: 1,
      minWidth: 0,
      minHeight: 40,
      paddingHorizontal: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.lightGrey,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    wearGoalOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    wearGoalOptionText: {
      color: colors.black,
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
    },
    wearGoalOptionTextSelected: {
      color: colors.primary,
    },
    submitBtn: {
      borderRadius: 10,
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
      flex: 1,
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
      lineHeight: 22,
    },
    dateContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    text: {
      color: colors.black,
      // fontSize: 15,
    },
    placeholderText: {
      color: colors.placeholder,
    },
  });

export default PurchaseForm;
