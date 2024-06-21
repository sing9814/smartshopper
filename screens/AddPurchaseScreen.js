import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import CustomButton from '../components/button';
import colors from '../utils/colors';
import AddButton from '../components/addButton';
import CustomInput from '../components/textInput';
import CustomDropdown from '../components/dropdown';
import { brands } from '../assets/json/brands';
import Error from '../components/error';
import ConfirmationPopup from '../components/confirmationPopup';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddPurchaseScreen = () => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(null);
  const [note, setNote] = useState(null);
  const [date, setDate] = useState(new Date());
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const [open, setOpen] = useState(false);
  const [regularPrice, setRegularPrice] = useState(null);
  const [paidPrice, setPaidPrice] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const addPurchase = async () => {
    if (itemName === '' || paidPrice === null || category === null) {
      setShowError(true);
    } else {
      setShowError(false);
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
      setPaidPrice();
      setDate(new Date());
      setShowConfirmation(true);
    }
  };

  return (
    <View style={styles.container}>
      {showError && <Error title={'Please fill in all missing fields'}></Error>}
      {showConfirmation && <ConfirmationPopup message="Purchase added sucessfully!" />}

      <View style={styles.innerContainer}>
        <CustomInput label="Item name" value={itemName} onChangeText={setItemName} />

        <CustomDropdown
          items={brands}
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
          component={<AddButton onPress={() => setDisabled(true)} size={20} disabled={disabled} />}
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
