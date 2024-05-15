import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  Dimensions,
  Text,
  StyleSheet,
  TouchableHighlight,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import { formatDate } from '../utils/date';

const BottomOverlay = ({ selectedDate, setSelectedDate, list }) => {
  const height = Dimensions.get('window').height * 0.5;
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (selectedDate) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: height,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [selectedDate, height]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.topContainer}>
        <Text style={styles.title}>{selectedDate}</Text>
        <TouchableHighlight
          style={styles.x}
          onPress={() => setSelectedDate(null)}
          underlayColor={colors.lightGrey}
        >
          <Ionicons name={'close'} size={16} color={colors.white} />
        </TouchableHighlight>
      </View>
      {list.map((item, index) => (
        <View key={index}>
          <View style={styles.mapContainer}>
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

              <Text style={styles.description}>
                {item.description ? item.description : '(no description)'}
              </Text>
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
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    height: '50%',
    padding: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  topContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.black,
  },
  x: {
    backgroundColor: 'gray',
    borderRadius: 50,
    height: 25,
    width: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapContainer: {
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
  description: {
    color: 'gray',
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
    color: 'gray',
  },
  date: {
    fontSize: 13,
    color: '#adadad',
  },
});

export default BottomOverlay;
