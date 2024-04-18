import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import CustomButton from '../components/button';
import colors from '../utils/colors';
import AddButton from '../components/addButton';
import CustomInput from '../components/textInput';

// Field: itemName (String)
// Field: description (String, optional)
// Field: regularPrice (Number)
// Field: markdownPrices (Array of Numbers)
// Field: paidPrice (Number)
// Field: purchaseDate (Date or Timestamp)
// Field: entryDate (Timestamp, set to the current time when saving)
// Field: imageUrl (String, optional)

const AddPurchaseScreen = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const [open, setOpen] = useState(false);
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrices, setSalePrices] = useState([]);
  const [paidPrice, setPaidPrice] = useState('');

  const handleAddSalePrice = () => {
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
    const userRef = firestore().collection('users').doc(auth().currentUser.uid);
    await userRef.collection('Purchases').add({
      name: name,
      regularPrice: regularPrice,
      salePrices: salePrices,
      paidPrice: paidPrice,
      datePurchased: date,
      dateCreated: firestore.FieldValue.serverTimestamp(),
    });
    setName('');
    setDescription('');
    setRegularPrice('');
    setSalePrices([]);
    setPaidPrice('');
    setDate(new Date());
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <CustomInput label="Item" value={name} onChangeText={setName} />

        <CustomInput label="Description" value={description} onChangeText={setDescription} />

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
          <AddButton onPress={handleAddSalePrice} size={24} />
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
      <Text>{paidPrice || 0}</Text>
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
    // paddingHorizontal: 16,
  },
  innerContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: colors.white,
    gap: 16,
    marginTop: 10,
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
