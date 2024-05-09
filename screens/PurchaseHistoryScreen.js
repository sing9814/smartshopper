import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { brands } from '../assets/json/brands';
import colors from '../utils/colors';
import BagSVG from '../assets/bags';

const PurchaseHistoryScreen = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  const getImageColor = async () => {
    try {
      const { width, height } = await new Promise((resolve, reject) => {
        Image.getSize(
          'path_to_your_image',
          (width, height) => {
            resolve({ width, height });
          },
          reject
        );
      });

      const scaledWidth = width * PixelRatio.get();
      const scaledHeight = height * PixelRatio.get();

      // Prefetch the image
      await Image.prefetch('path_to_your_image');

      // Get the first pixel color
      const pixelData = await new Promise((resolve, reject) => {
        ImageEditor.cropImage(
          'path_to_your_image',
          {
            offset: { x: 0, y: 0 },
            size: { width: 1, height: 1 },
            displaySize: { width: scaledWidth, height: scaledHeight },
            resizeMode: 'contain',
          },
          resolve,
          reject
        );
      });

      const firstPixelColor = pixelData ? pixelData[0] : null;
      console.log('Color of first pixel:', firstPixelColor);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const subscriber = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('Purchases')
        .onSnapshot((querySnapshot) => {
          const purchasesArray = [];

          querySnapshot.forEach((documentSnapshot) => {
            purchasesArray.push({
              ...documentSnapshot.data(),
              key: documentSnapshot.id,
            });
          });

          setPurchases(purchasesArray);
          setLoading(false);
        });

      return () => subscriber();
    }
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  const formatDate = (date) => {
    return new Date(date.seconds * 1000 + date.nanoseconds / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderFooter = () => (
    <View style={{ padding: 8, alignItems: 'center' }}>
      <Text>No more data to show</Text>
    </View>
  );

  return (
    <View>
      <FlatList
        data={purchases}
        contentContainerStyle={styles.list}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <View style={styles.container}>
            <View style={styles.imageContainer}>
              <Image
                style={styles.image}
                source={
                  item.brand?.image
                    ? {
                        uri: item.brand.image,
                      }
                    : require('../assets/bag.png')
                }
              ></Image>
            </View>
            <View style={styles.textContainer}>
              <View style={styles.priceContainer}>
                <Text style={styles.item}>{item.name}</Text>
                <Text style={styles.date}>• 0 wears</Text>
              </View>

              <Text style={styles.description}>{item.description ? item.description : ''}</Text>
            </View>
            <View style={styles.rightContainer}>
              <Text style={styles.date}>{formatDate(item.datePurchased)}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.paidPrice}>${item.paidPrice}</Text>
                {item.paidPrice !== item.regularPrice && (
                  <Text style={styles.regularPrice}>${item.regularPrice}</Text>
                )}
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 65,
    flexGrow: 0,
  },
  container: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 10,
    borderBottomColor: colors.bg,
    // borderBottomWidth: 3,
    marginBottom: 2,
  },
  item: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 15,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 100,
    padding: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
    objectFit: 'contain',
  },
  textContainer: {
    justifyContent: 'center',
    gap: 4,
    marginLeft: 10,
  },
  rightContainer: {
    position: 'absolute',
    height: '100%',
    right: 0,
    marginRight: 16,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  priceContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  paidPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: '#42c229',
    marginRight: 2,
  },
  regularPrice: {
    textDecorationLine: 'line-through',
  },
  date: {
    fontSize: 13,
    color: '#adadad',
  },
});

export default PurchaseHistoryScreen;
