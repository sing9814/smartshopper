import { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, useWindowDimensions } from 'react-native';
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
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';

const AnimatedFlatList = Animated.createAnimatedComponent(require('react-native').FlatList);

const OnboardingScreen = ({ route }) => {
  const dispatch = useDispatch();
  const scrollX = useSharedValue(0);
  const { name = '', email = '', userId = '' } = route.params || {};
  const { width } = useWindowDimensions();
  const [isSliding, setIsSliding] = useState(false);
  const [sliderValue, setSliderValue] = useState(100);
  const [gradientColors, setGradientColors] = useState([
    lightTheme.primaryDark,
    lightTheme.primary,
  ]);

  const slides = [
    {
      colors: [lightTheme.primaryDark, lightTheme.primary],
      svg: Logo,
      svgProps: { height: 110, width: 110 },
      title: 'Smart Shopper',
      description: 'Start organizing your wardrobe in just a few taps',
    },
    {
      colors: [lightTheme.primary, lightTheme.primaryDark],
      diagonal: true,
      svg: Form,
      title: 'Track items',
      description: 'Quickly add and edit your clothing items using our simple form',
    },
    {
      colors: [lightTheme.primaryDark, lightTheme.primary],
      svg: WomanSVG,
      svgProps: { color: lightTheme.white, height: 150, opacity: 1 },
      title: 'Track your wears',
      description: "Know what you love most. See what gets worn and what doesn't",
    },
    {
      colors: [lightTheme.primaryDark, lightTheme.accent],
      diagonal: true,
      image: require('../../assets/onboarding/progress.png'),
      title: 'Get started',
      description: 'Set a monthly budget to keep your spending on track',
      button: true,
    },
  ];

  const inputRange = slides.map((_, i) => i * width);
  const startColors = slides.map((slide) => slide.colors[0]);
  const endColors = slides.map((slide) => slide.colors[1]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  useAnimatedReaction(
    () => scrollX.value,
    (value) => {
      const start = interpolateColor(value, inputRange, startColors);
      const end = interpolateColor(value, inputRange, endColors);
      runOnJS(setGradientColors)([start, end]);
    },
    []
  );

  const onPress = async () => {
    try {
      await firestore().collection('users').doc(userId).set({
        email,
        name,
        budget: sliderValue,
        registrationDate: firestore.FieldValue.serverTimestamp(),
      });
      dispatch(setUserOnboarded(true));
    } catch (e) {
      console.log(e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      {item.image && <Image source={item.image} style={styles.image} resizeMode="contain" />}
      {item.svg && <item.svg {...item.svgProps} />}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {item.button && (
        <>
          <View style={{ alignItems: 'center', position: 'relative', width: '100%' }}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={1000}
              step={10}
              value={sliderValue}
              onValueChange={setSliderValue}
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
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <AnimatedFlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.title}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        scrollEnabled={!isSliding}
        initialNumToRender={1}
        windowSize={2}
        maxToRenderPerBatch={2}
      />

      <View style={styles.paginator}>
        {slides.map((_, i) => {
          const animatedDotStyle = useAnimatedStyle(() => {
            const dotWidth = interpolate(
              scrollX.value,
              [(i - 1) * width, i * width, (i + 1) * width],
              [10, 20, 10],
              'clamp'
            );
            const opacity = interpolate(
              scrollX.value,
              [(i - 1) * width, i * width, (i + 1) * width],
              [0.6, 1, 0.6],
              'clamp'
            );
            return { width: dotWidth, opacity };
          });

          return <Animated.View key={i} style={[styles.dot, animatedDotStyle]} />;
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
  textContainer: {
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
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
