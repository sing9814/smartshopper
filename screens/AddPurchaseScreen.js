import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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

const AddPurchaseScreen = () => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(null);
  const [note, setNote] = useState(null);
  const [date, setDate] = useState(new Date());
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const [open, setOpen] = useState(false);
  const [regularPrice, setRegularPrice] = useState(null);
  const [salePrices, setSalePrices] = useState([]);
  const [store, setStore] = useState(null);
  const [compareAtPrice, setCompareAtPrice] = useState(null);
  const [showError, setShowError] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // const brands = [
  //   {
  //     // label: 'He',
  //     name: 'A|X Armani Exchange',
  //     image:
  //       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwGjXf1ZswJLlxBtf4r3ei125dpxuaol__v9aE5PdtgvuS4KvPXquknArLgEw&s',
  //   },
  //   {
  //     // label: 'He',
  //     name: 'adidas',
  //     image:
  //       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvOqr1CSBSGnG_GyX9Kk6fXdIhz52ubsSTzR_QvmZmUBz4WSRGK8FQxxFNtw&s',
  //   },
  // ];

  const handleSelect = (selectedValue) => {
    setCategory(selectedValue);
  };

  const handleAddSalePrice = () => {
    if (salePrices.length > 1) {
      setDisabled(true);
    }
    setSalePrices([...salePrices, '']);
  };

  const handleSalePriceChange = (index, value) => {
    const updatedSalePrices = [...salePrices];
    updatedSalePrices[index] = value;
    setSalePrices(updatedSalePrices);
  };

  const addPurchase = async () => {
    if (itemName === '' || regularPrice === null || category === null) {
      setShowError(true);
    } else {
      setShowError(false);
      const userRef = firestore().collection('users').doc(auth().currentUser.uid);
      await userRef.collection('Purchases').add({
        name: itemName,
        category: category,
        note: note,
        wears: 0,
        brand: brand,
        regularPrice: regularPrice,
        salePrices: salePrices,
        paidPrice: salePrices.length === 0 ? regularPrice : salePrices[salePrices.length - 1],
        store: store,
        compareAtPrice: compareAtPrice,
        datePurchased: date.toISOString().split('T')[0],
        dateCreated: firestore.FieldValue.serverTimestamp(),
      });
      setItemName('');
      setCategory(null);
      setNote('');
      setBrand('');
      setRegularPrice('');
      setSalePrices([]);
      setStore('');
      setCompareAtPrice(null);
      setDate(new Date());
      setDisabled(false);
    }
  };

  return (
    <View style={styles.container}>
      {showError && <Error title={'Please fill in all missing fields'}></Error>}

      <View style={styles.innerContainer}>
        <CustomInput label="Item name" value={itemName} onChangeText={setItemName} />

        <CustomDropdown
          items={brands}
          onSelect={handleSelect}
          selectedItem={category}
          setSelectedItem={setCategory}
        />

        <CustomInput label="Brand (optional)" value={brand} onChangeText={setBrand} />

        <CustomButton onPress={() => setOpen(true)} title={formattedDate} icon="calendar" />
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

        <View style={styles.regPriceContainer}>
          <CustomInput
            label="Regular price"
            value={regularPrice}
            onChangeText={setRegularPrice}
            type="numeric"
          />
          <AddButton onPress={handleAddSalePrice} size={24} disabled={disabled} />
        </View>

        {salePrices.map((price, index) => (
          <CustomInput
            key={index}
            label={`Sale price ${index + 1}`}
            value={price}
            onChangeText={(value) => handleSalePriceChange(index, value)}
            type="numeric"
          />
        ))}

        <CustomInput label="Note (optional)" value={note} onChangeText={setNote} />
        <CustomInput label="Store (optional)" value={store} onChangeText={setStore} />
        <CustomInput
          label="Compare at price (optional)"
          value={compareAtPrice}
          onChangeText={setCompareAtPrice}
          type="numeric"
        />
      </View>
      <CustomButton buttonStyle={styles.button} onPress={addPurchase} title="Submit" />
    </View>
  );
};

const styles = StyleSheet.create({
  blackText: {
    color: 'black',
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
    // width: '100%',
    // flex: 1,
  },
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
  regPriceContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});

export default AddPurchaseScreen;
