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
import Logo from '../../assets/logo';
import Form from '../../assets/onboarding/form';
import WomanSVG from '../../assets/womanSVG';
import LinearGradient from 'react-native-linear-gradient';

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
      colors: [lightTheme.primaryDark, lightTheme.primary],
      svg: Logo,
      svgProps: { height: 130, width: 150 },
      title: 'Smart Shopper',
      description: 'Start organizing your wardrobe in just a few taps.',
      backgroundColor: `${lightTheme.primary}`,
    },
    {
      colors: [lightTheme.primary, lightTheme.primaryDark],
      diagonal: true,
      svg: Form,
      title: 'Add items',
      description: 'Quickly add and edit your clothing items using our streamlined form.',
      backgroundColor: `${lightTheme.primaryDark}`,
    },
    {
      colors: [lightTheme.primary, lightTheme.primaryDark],
      svg: WomanSVG,
      svgProps: { color: lightTheme.white, height: 150, opacity: 1 },
      title: 'Track your wears',
      description: 'Know what you love most. See wear counts and make smarter choices.',
      backgroundColor: `${lightTheme.primary}`,
    },
    {
      colors: [lightTheme.primaryDark, lightTheme.accent],
      diagonal: true,
      image: require('../../assets/onboarding/progress.png'),
      title: 'Ready to take control?',
      description: 'Stay on budget without stress. Set your monthly limit.',
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
      <LinearGradient
        colors={item.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: item.diagonal ? 1 : 0 }}
        style={[styles.slide, { width }]}
        key={item.title}
      >
        {item.image && <Image source={item.image} style={styles.image} resizeMode="contain" />}
        {item.svg && <item.svg {...item.svgProps}></item.svg>}

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
                position: 'absolute',
                bottom: 70,
              }}
              textStyle={{ color: lightTheme.primary, fontWeight: '600' }}
              underlayColor="#dadada"
              onPress={onPress}
              title="Done"
            />
          </>
        )}
      </LinearGradient>
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
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 20,
  },
  container: {
    flex: 1,
  },
  image: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    marginBottom: -10,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 26,
    alignItems: 'center',
    gap: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 17,
    color: '#fff',
    lineHeight: 33,
    textAlign: 'center',
    paddingHorizontal: 10,
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
