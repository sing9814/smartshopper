import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Text, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import CustomButton from './button';
import colors from '../utils/colors';
import AddButton from './addButton';
import CustomInput from './customInput';
import CustomDropdown from './dropdown';
import Error from './error';
import ConfirmationPopup from './confirmationPopup';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from './header';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setPurchases, setCurrentPurchase } from '../redux/actions/purchaseActions';
import uuid from 'react-native-uuid';
import { generateFirestoreTimestamp } from '../utils/date';
import CustomCategorySheet from './customCategorySheet';
import { setCategories } from '../redux/actions/userActions';

const PurchaseForm = ({ purchase, navigation, name, edit }) => {
  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase.purchases);
  const categories = useSelector((state) => state.user.categories);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const [open, setOpen] = useState(false);
  const [regularPrice, setRegularPrice] = useState(null);
  const [paidPrice, setPaidPrice] = useState(null);
  const [note, setNote] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showClearButton, setShowClearButton] = useState(false);

  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [customSubcategoryName, setCustomSubcategoryName] = useState('');

  useEffect(() => {
    if (purchase) {
      setItemName(purchase.name);
      setCategory(purchase.category);
      setDate(new Date(purchase.datePurchased));
      setRegularPrice(purchase.regularPrice);
      setPaidPrice(purchase.paidPrice);
      setNote(purchase.note);
      setDisabled(purchase.paidPrice ? true : false);
    } else if (name) {
      setItemName(name);
    }
  }, [purchase, name]);

  useFocusEffect(
    useCallback(() => {
      setErrorMessage(null);
    }, [])
  );

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => setConfirmationMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  useEffect(() => {
    const checkFields = () => {
      return (
        itemName !== '' ||
        category !== null ||
        regularPrice !== null ||
        paidPrice !== null ||
        note !== null
      );
    };
    setShowClearButton(checkFields());
  }, [itemName, category, regularPrice, paidPrice, note]);

  const handleSelect = (selectedValue) => {
    setCategory(selectedValue);
  };

  const removeSalePrice = () => {
    setDisabled(false);
    setPaidPrice(null);
  };

  const validatePrice = (price) => {
    const regex = /^\d+(\.\d{1,2})?$/;
    return regex.test(price);
  };

  const validateName = (name) => {
    const regex = /^(?=.*[A-Za-z0-9]).+$/;
    return regex.test(name);
  };

  const validateFields = () => {
    setErrorMessage(null);
    if (!validateName(itemName) || regularPrice === '' || category?.category === null) {
      return setErrorMessage('Please fill in all missing fields');
    }
    if (!validatePrice(regularPrice) || (paidPrice && !validatePrice(paidPrice))) {
      return setErrorMessage('Prices must be a valid number with up to 2 decimal places');
    }
    if (paidPrice && parseFloat(paidPrice) >= parseFloat(regularPrice)) {
      return setErrorMessage('Sale price must be less than regular price');
    }
    setErrorMessage(null);
    return true;
  };

  const mergeCategory = (categories, newItem) => {
    const updated = [...categories];
    const match = updated.find((c) => c.name === newItem.category);
    if (match) {
      if (!match.subCategories.includes(newItem.subCategory)) {
        match.subCategories.push(newItem.subCategory);
      }
    } else {
      updated.push({ name: newItem.category, subCategories: [newItem.subCategory] });
    }
    return updated;
  };

  const updatePurchaseInArray = (purchase) => {
    return purchases.map((p) => (p.key === purchase.key ? purchase : p));
  };

  const updatePurchase = async () => {
    if (validateFields()) {
      try {
        const userRef = firestore().collection('users').doc(auth().currentUser.uid);
        const updatedPurchase = {
          key: purchase.key,
          name: itemName,
          wears: purchase.wears,
          category: category,
          note: note,
          edited: generateFirestoreTimestamp(),
          regularPrice: regularPrice,
          paidPrice: paidPrice,
          datePurchased: date.toISOString().split('T')[0],
          dateCreated: purchase.dateCreated,
        };
        await userRef.collection('Purchases').doc(purchase.key).update(updatedPurchase);
        dispatch(setCurrentPurchase(updatedPurchase));
        dispatch(setPurchases(updatePurchaseInArray(updatedPurchase)));
        setShowConfirmation(true);
        navigation.goBack();
      } catch (error) {
        console.error('Error updating purchase: ', error);
        setErrorMessage('An error occurred while updating the purchase. Please try again.');
      }
    }
  };

  const handleSubmit = () => {
    if (purchase) {
      updatePurchase();
    } else {
      addPurchase();
    }
  };

  const addPurchase = async () => {
    if (validateFields()) {
      try {
        const userRef = firestore().collection('users').doc(auth().currentUser.uid);
        const id = uuid.v4();
        const newPurchase = {
          key: id,
          name: itemName,
          category: category,
          note: note,
          wears: [],
          regularPrice: regularPrice,
          paidPrice: paidPrice,
          datePurchased: date.toISOString().split('T')[0],
          dateCreated: generateFirestoreTimestamp(),
        };
        await userRef.collection('Purchases').doc(id).set(newPurchase);
        dispatch(setPurchases([newPurchase, ...purchases]));
        resetFields();
        setConfirmationMessage('Purchase added successfully!');
      } catch (error) {
        console.error('Error adding purchase: ', error);
        setErrorMessage('An error occurred while adding the purchase. Please try again.');
      }
    }
  };

  const resetFields = () => {
    setItemName('');
    setCategory(null);
    setNote(null);
    setRegularPrice(null);
    setPaidPrice(null);
    setDate(new Date());
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header title={edit ? `Edit ${purchase.name}` : 'Add Purchase'}></Header>
      {confirmationMessage !== '' && <ConfirmationPopup message={confirmationMessage} />}
      <View style={styles.container}>
        {errorMessage && <Error title={errorMessage} style={{ marginTop: 12 }}></Error>}

        <View style={styles.innerContainer}>
          <CustomInput
            label="Item name"
            value={itemName}
            onChangeText={setItemName}
            editable={edit && false}
          />

          <CustomDropdown
            items={categories}
            onSelect={handleSelect}
            selectedItem={category}
            setSelectedItem={setCategory}
            onOpenCustomSheet={(searchValue) => {
              setCustomSubcategoryName(searchValue);
              setShowCustomSheet(true);
            }}
          />

          <CustomButton
            onPress={() => setOpen(true)}
            title={formattedDate}
            icon={<Ionicons name={'calendar'} size={20} color={colors.white} />}
          />
          <DatePicker
            modal
            open={open}
            date={date}
            onConfirm={(date) => {
              setOpen(false);
              setDate(date);
            }}
            onCancel={() => {
              setOpen(false);
            }}
            mode={'date'}
          />

          <CustomInput
            label="Regular price"
            value={regularPrice}
            onChangeText={setRegularPrice}
            type="numeric"
            component={
              <AddButton onPress={() => setDisabled(true)} size={20} disabled={disabled} />
            }
          />

          {disabled && (
            <CustomInput
              label={`Sale price`}
              value={paidPrice}
              onChangeText={setPaidPrice}
              type="numeric"
              component={
                <TouchableWithoutFeedback onPress={removeSalePrice}>
                  <Ionicons style={styles.icon} name={'remove-outline'} size={16} color={'gray'} />
                </TouchableWithoutFeedback>
              }
            />
          )}

          <CustomInput label="Note (optional)" value={note} onChangeText={setNote} multiline />
        </View>
        {showClearButton && !edit && (
          <TouchableOpacity style={styles.clearBtn} onPress={resetFields}>
            <Text style={styles.clear}>Clear all</Text>
          </TouchableOpacity>
        )}
        <CustomButton
          buttonStyle={[styles.button, { bottom: edit ? 12 : 75 }]}
          onPress={handleSubmit}
          title={edit ? 'Update' : 'Submit'}
        />
      </View>
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
          setConfirmationMessage(wasAdded ? 'Custom category added!' : 'Category already exists.');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  innerContainer: {
    width: '100%',
    paddingTop: 12,
    // padding: 16,
    // backgroundColor: colors.white,
    gap: 16,
    paddingHorizontal: 8,
    // marginTop: 12,
    borderRadius: 10,
  },
  button: {
    position: 'absolute',
  },
  icon: {
    padding: 12,
    borderRadius: 50,
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginRight: 8,
  },
  clear: {
    color: colors.primary,
  },
});

export default PurchaseForm;
