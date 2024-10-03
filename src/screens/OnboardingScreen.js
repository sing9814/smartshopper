import React, { useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Button,
  FlatList,
  useWindowDimensions,
  Animated,
  StatusBar,
} from 'react-native';
import colors from '../utils/colors';
import CustomButton from '../components/button';
import firestore from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import { setUserOnboarded } from '../redux/actions/userActions';

const OnboardingScreen = ({ route }) => {
  const dispatch = useDispatch();

  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const { name = '', email = '', userId = '' } = route.params || {};

  const { width } = useWindowDimensions();

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const slides = [
    {
      title: 'Welcome to Smart Shopper',
      description: 'Track your purchases easily and stay organized!',
      backgroundColor: `${colors.primary}`,
    },
    {
      title: 'Add Items Quickly',
      description: 'Add and edit your clothing items with a simple form.',
      backgroundColor: `${colors.primaryDark}`,
    },
    {
      title: 'Track Usage',
      description: 'Monitor how many times you wear your favorite clothing items!',
      backgroundColor: `${colors.primary}`,
      button: true,
    },
  ];

  const onPress = async () => {
    console.log('item');
    try {
      await firestore().collection('users').doc(userId).set({
        email: email,
        name: name,
        registrationDate: firestore.FieldValue.serverTimestamp(),
      });
      dispatch(setUserOnboarded(true));
    } catch (e) {
      console.log(e);
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <View
        style={[styles.slide, { backgroundColor: item.backgroundColor }, { width }]}
        key={item.title}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        {item.button && (
          <CustomButton
            buttonStyle={{
              backgroundColor: colors.primaryDark,
              width: 100,
              position: 'absolute',
              bottom: 50,
              right: 30,
            }}
            underlayColor="#777"
            onPress={onPress}
            title="Finish"
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={32}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      ></FlatList>

      <View style={styles.paginator}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              style={[styles.dot, { width: dotWidth, opacity }]}
              key={i.toString()}
            ></Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  paginator: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 8,
  },
});

export default OnboardingScreen;
