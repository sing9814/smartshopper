import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CustomButton from '../components/button';
import { useTheme } from '../theme/themeContext';
import CustomInput from '../components/customInput';
import CustomDropdown from '../components/dropdown';
import Header from '../components/header';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setCollections, setCurrentPurchase } from '../redux/actions/purchaseActions';
import uuid from 'react-native-uuid';
import { generateFirestoreTimestamp } from '../utils/date';
import Banner from '../components/banner';
import { useStatusBar } from '../hooks/useStatusBar';

const CollectionForm = ({ collection, navigation, name, edit }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  const dispatch = useDispatch();

  const collections = useSelector((state) => state.purchase.collections);

  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');
  const [showClearButton, setShowClearButton] = useState(false);
  const [banner, setBanner] = useState(null);

  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  useEffect(() => {
    if (collection) {
      setCollectionName(collection.name);
      setDescription(collection.description || '');
    } else if (name) {
      setCollectionName(name);
    }
  }, [collection, name]);

  useFocusEffect(
    useCallback(() => {
      setBanner(null);
    }, [])
  );

  useEffect(() => {
    const hasInput = collectionName.trim() !== '' || description.trim() !== '';
    setShowClearButton(hasInput);
  }, [collectionName, description]);

  const validateFields = () => {
    if (collectionName.trim() === '') {
      showBanner('Please enter a name for your collection.');
      return false;
    }
    return true;
  };

  const addCollection = async () => {
    if (!validateFields()) return;

    try {
      const userRef = firestore().collection('users').doc(auth().currentUser.uid);
      const id = uuid.v4();
      const newCollection = {
        id,
        name: collectionName.trim(),
        description: description.trim(),
        items: [],
        dateCreated: generateFirestoreTimestamp(),
      };

      await userRef.collection('Collections').doc(id).set(newCollection);
      resetFields();
      const updatedCollections = [newCollection, ...collections];
      dispatch(setCollections(updatedCollections));
      showBanner('Collection created!', 'success');
    } catch (error) {
      console.error('Error adding collection:', error);
      showBanner('An error occurred while creating the collection.');
    }
  };

  const handleSubmit = () => {
    if (collection) {
      // WIP
    } else {
      addCollection();
    }
  };

  const resetFields = () => {
    setCollectionName('');
    setDescription('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Header
        title={edit ? `Edit ${collection.name}` : 'Create Collection'}
        style={{ backgroundColor: colors.primaryDark }}
      />

      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}

      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <CustomInput
            label="Name"
            placeholder="Enter collection name"
            value={collectionName}
            onChangeText={setCollectionName}
          />

          <CustomInput
            label="Description"
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {showClearButton && !edit && (
          <TouchableOpacity style={styles.clearBtn} onPress={resetFields}>
            <Text style={styles.clear}>Clear all</Text>
          </TouchableOpacity>
        )}

        <CustomButton
          buttonStyle={[styles.submitBtn, { bottom: edit ? 12 : 75 }]}
          onPress={handleSubmit}
          title={edit ? 'Update' : 'Submit'}
        />
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    innerContainer: {
      width: '100%',
      paddingTop: 2,
      gap: 8,
      paddingHorizontal: 8,
      marginTop: 12,
      borderRadius: 10,
    },
    submitBtn: {
      position: 'absolute',
      backgroundColor: colors.primaryDark,
    },
    clearBtn: {
      alignSelf: 'flex-end',
      marginTop: 8,
      marginRight: 8,
    },
    clear: {
      color: colors.primary,
      fontWeight: '500',
    },
  });

export default CollectionForm;
