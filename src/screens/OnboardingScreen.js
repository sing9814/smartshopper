import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import { lightTheme } from '../theme/colors';
import CustomButton from '../components/button';
import firestore from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import { setUserOnboarded } from '../redux/actions/userActions';
import Slider from '@react-native-community/slider';
import CustomInput from '../components/customInput';

const OnboardingScreen = ({ route }) => {
  const dispatch = useDispatch();
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const { name = '', email = '', userId = '' } = route.params || {};
  const { width } = useWindowDimensions();
  const [isSliding, setIsSliding] = useState(false);
  const [sliderValue, setSliderValue] = useState(100);

  const slides = [
    {
      image: require('../../assets/onboarding/icon.png'),
      title: 'Welcome to Smart Shopper',
      description: 'Effortlessly track your purchases and keep your wardrobe organized!',
      backgroundColor: `${lightTheme.primary}`,
    },
    {
      title: 'Add Items Quickly',
      description: 'Add and edit your clothing items with a simple form.',
      backgroundColor: `${lightTheme.primaryDark}`,
    },
    {
      title: 'Track Your Wardrobe',
      description:
        'Keep tabs on how often you wear your favorite pieces and stay informed about your cost per wear (CPW)\n\n(Long hold item on history screen to quick add a wear)',
      backgroundColor: `${lightTheme.primary}`,
    },
    {
      title: 'Set a monthly budget',
      description:
        'Take control of your spending by setting a monthly budget and stay on track with your financial goals!',
      backgroundColor: `${lightTheme.primary}`,
      button: true,
    },
  ];

  const onPress = async () => {
    try {
      await firestore().collection('users').doc(userId).set({
        email: email,
        name: name,
        budget: sliderValue,
        registrationDate: firestore.FieldValue.serverTimestamp(),
      });
      dispatch(setUserOnboarded(true));
    } catch (e) {
      console.log(e);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View
        style={[
          styles.slide,
          { backgroundColor: item.backgroundColor },
          { width },
          item.image ? { paddingTop: '30%' } : { justifyContent: 'center' },
        ]}
        key={item.title}
      >
        {item.image && <Image source={item.image} style={styles.image} resizeMode="contain" />}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {item.button && (
          <>
            <View style={{ alignItems: 'center', position: 'relative', width: '100%' }}>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={1000}
                step={1}
                value={sliderValue}
                onValueChange={(value) => {
                  setSliderValue(value);
                }}
                onTouchStart={() => setIsSliding(true)}
                onTouchEnd={() => setIsSliding(false)}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#000000"
                thumbTintColor="white"
              />

              <CustomInput
                label=""
                value={sliderValue.toString()}
                onChangeText={(value) => setSliderValue(Number(value))}
                type="numeric"
                budget
              />
            </View>

            <CustomButton
              buttonStyle={{
                backgroundColor: '#fff',
                width: 100,
                position: 'absolute',
                bottom: 50,
                right: 30,
              }}
              textStyle={{ color: lightTheme.primary, fontWeight: '600' }}
              underlayColor="#777"
              onPress={onPress}
              title="Done"
            />
          </>
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
        keyExtractor={(item) => item.title}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={32}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ref={slidesRef}
        scrollEnabled={!isSliding}
      />

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
  image: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    margin: 30,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 26,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    marginTop: 18,
    lineHeight: 25,
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
