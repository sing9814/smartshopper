import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TextInput, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';

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

  const [purchaseDate, setPurchaseDate] = useState('');

  const [regularPrice, setRegularPrice] = useState('');
  const [salePrices, setSalePrices] = useState([]);
  const [paidPrice, setPaidPrice] = useState('');

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);

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

  const renderSalePriceInputs = () => {
    return salePrices.map((price, index) => (
      <TextInput
        style={styles.blackText}
        key={index}
        value={price}
        onChangeText={(value) => handleSalePriceChange(index, value)}
        placeholder="Enter sale price"
        placeholderTextColor={'gray'}
        keyboardType="numeric"
      />
    ));
  };

  const handlePaidPriceChange = (value) => {
    setPaidPrice(value);
  };

  const addPurchase = async () => {
    const userRef = firestore().collection('users').doc(auth().currentUser.uid);
    await userRef.collection('Purchases').add({
      name: name,
      regularPrice: regularPrice,
      salePrices: salePrices,
      paidPrice: paidPrice,
      dateCreated: firestore.FieldValue.serverTimestamp(),
    });
    setRegularPrice('');
    setSalePrices([]);
    setPaidPrice('');
  };

  return (
    <View>
      <View>
        <Button title="Open" onPress={() => setOpen(true)} />
        <Text style={styles.blackText}>{date.toString()}</Text>
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

        <TextInput
          style={styles.blackText}
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
          placeholderTextColor={'gray'}
        />
        <TextInput
          style={styles.blackText}
          value={regularPrice}
          onChangeText={setRegularPrice}
          placeholder="Enter regular price"
          placeholderTextColor={'gray'}
          keyboardType="numeric"
        />

        {renderSalePriceInputs()}

        <Button title="Add Sale Price" onPress={handleAddSalePrice} />

        <TextInput
          style={styles.blackText}
          value={paidPrice}
          onChangeText={handlePaidPriceChange}
          placeholder="Enter paid price"
          placeholderTextColor={'gray'}
          keyboardType="numeric"
        />
      </View>
      <Button title="Add" onPress={addPurchase} />
    </View>
  );
};

const styles = StyleSheet.create({
  blackText: {
    color: 'black',
  },
});

export default AddPurchaseScreen;
