import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import CustomButton from '../components/button';
import colors from '../utils/colors';
import AddButton from '../components/addButton';
import CustomInput from '../components/textInput';
import CustomDropdown from '../components/dropdown';
import { categories } from '../assets/json/categories';
import Error from '../components/error';
import ConfirmationPopup from '../components/confirmationPopup';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/header';

const AddPurchaseScreen = ({ route }) => {
  const { name = '' } = route.params || {};
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (name) {
      setItemName(name);
    }
  }, [name]);

  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation]);

  const handleSelect = (selectedValue) => {
    setCategory(selectedValue);
  };

  const removeSalePrice = () => {
    setDisabled(false);
    setPaidPrice('');
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
    if (!validateName(itemName) || regularPrice === null || category?.category === null) {
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

  const addPurchase = async () => {
    if (validateFields()) {
      try {
        const userRef = firestore().collection('users').doc(auth().currentUser.uid);
        await userRef.collection('Purchases').add({
          name: itemName,
          category: category,
          note: note,
          wears: 0,
          regularPrice: regularPrice,
          paidPrice: paidPrice,
          datePurchased: date.toISOString().split('T')[0],
          dateCreated: firestore.FieldValue.serverTimestamp(),
        });
        setItemName('');
        setCategory(null);
        setNote('');
        setRegularPrice('');
        setPaidPrice(null);
        setDate(new Date());
        setShowConfirmation(true);
      } catch (error) {
        console.error('Error adding purchase: ', error);
        setErrorMessage('An error occurred while adding the purchase. Please try again.');
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={'Add Purchase'}></Header>
      {showConfirmation && <ConfirmationPopup message="Purchase added sucessfully!" />}
      <View style={styles.container}>
        {errorMessage && <Error title={errorMessage} style={{ marginTop: 12 }}></Error>}

        <View style={styles.innerContainer}>
          <CustomInput label="Item name" value={itemName} onChangeText={setItemName} />

          <CustomDropdown
            items={categories}
            onSelect={handleSelect}
            selectedItem={category}
            setSelectedItem={setCategory}
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
        <CustomButton buttonStyle={styles.button} onPress={addPurchase} title="Submit" />
      </View>
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
    padding: 16,
    backgroundColor: colors.white,
    gap: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  button: {
    position: 'absolute',
    bottom: 75,
  },
  icon: {
    padding: 12,
    borderRadius: 50,
  },
});

export default AddPurchaseScreen;
