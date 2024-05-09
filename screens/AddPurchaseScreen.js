import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import CustomButton from '../components/button';
import colors from '../utils/colors';
import AddButton from '../components/addButton';
import CustomInput from '../components/textInput';
import { Dropdown } from 'react-native-element-dropdown';
import CustomDropdown from '../components/dropdown';
import { brands } from '../assets/json/brands';
import Error from '../components/error';

const AddPurchaseScreen = () => {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState(null);
  const [date, setDate] = useState(new Date());
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const [open, setOpen] = useState(false);
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrices, setSalePrices] = useState([]);
  const [paidPrice, setPaidPrice] = useState(null);
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
    setBrand(selectedValue);
    console.log('Selected value:', selectedValue);
    // Add your logic here to handle the selected item
  };

  const handleAddSalePrice = () => {
    if (salePrices.length > 1) {
      setDisabled(true);
    }
    setSalePrices([...salePrices, '']);
  };

  useEffect(() => {
    if (salePrices.length === 0) {
      setPaidPrice(regularPrice);
    } else {
      setPaidPrice(salePrices[salePrices.length - 1]);
    }
  }, [salePrices, regularPrice]);

  const handleSalePriceChange = (index, value) => {
    const updatedSalePrices = [...salePrices];
    updatedSalePrices[index] = value;
    setSalePrices(updatedSalePrices);
  };

  const addPurchase = async () => {
    if (itemName === '' || regularPrice === '') {
      setShowError(true);
    } else {
      setShowError(false);
      const userRef = firestore().collection('users').doc(auth().currentUser.uid);
      await userRef.collection('Purchases').add({
        name: itemName,
        description: description,
        brand: brand,
        regularPrice: regularPrice,
        salePrices: salePrices,
        paidPrice: paidPrice,
        datePurchased: date,
        dateCreated: firestore.FieldValue.serverTimestamp(),
      });
      setItemName('');
      setDescription('');
      setBrand(null);
      setRegularPrice('');
      setSalePrices([]);
      setPaidPrice(null);
      setDate(new Date());
    }
  };

  // console.log(regularPrice);

  return (
    <View style={styles.container}>
      {showError && <Error title={'Please fill in all missing fields'}></Error>}

      <View style={styles.innerContainer}>
        <CustomInput label="Item name*" value={itemName} onChangeText={setItemName} />

        <CustomInput label="Description" value={description} onChangeText={setDescription} />

        <CustomDropdown
          items={brands}
          onSelect={handleSelect}
          selectedItem={brand}
          setSelectedItem={setBrand}
        />

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
            label="Regular price*"
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
      </View>
      {/* <Text>{paidPrice || 0}</Text> */}
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
