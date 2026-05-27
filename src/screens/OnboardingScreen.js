import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { lightTheme } from '../theme/colors';
import CustomButton from '../components/button';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { setUserOnboarded } from '../redux/actions/userActions';
import Logo from '../../assets/logo';
import Form from '../../assets/onboarding/form';
import WomanSVG from '../../assets/womanSVG';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

const OnboardingScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const scrollX = useSharedValue(0);
  const isCompletingRef = useRef(false);
  const { isReplay = false } = route.params || {};
  const { width } = useWindowDimensions();
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
      description: 'Track your wardrobe spending and see what your clothes are really worth',
    },
    {
      colors: [lightTheme.primary, lightTheme.primaryDark],
      diagonal: true,
      svg: Form,
      title: 'Track items',
      description: 'Quickly add and edit your clothing items using our simple form',
    },
    {
      colors: [lightTheme.primaryDark, lightTheme.secondary],
      svg: WomanSVG,
      svgProps: { color: lightTheme.white, height: 150, opacity: 1 },
      title: 'Track your wears',
      description: "Log each wear to see what gets worn and what doesn't",
    },
    {
      colors: [lightTheme.secondary, lightTheme.primary],
      icon: 'calendar-outline',
      title: 'Look back anytime',
      description: 'Use your calendar and item history to see what you actually wear most',
    },
    {
      colors: [lightTheme.primary, lightTheme.primaryDark],
      diagonal: true,
      icon: 'bag-add-outline',
      title: 'Get started',
      description: 'Add your first item and start seeing what you actually wear',
      button: true,
    },
  ];

  const inputRange = slides.map((_, i) => i * width);
  const startColors = slides.map((slide) => slide.colors[0]);
  const endColors = slides.map((slide) => slide.colors[1]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const swipeHintAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollX.value, [0, width * 0.45, width], [0.88, 0.35, 0], 'clamp');
    return { opacity };
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
    if (isCompletingRef.current) {
      return;
    }

    if (isReplay) {
      navigation.goBack();
      return;
    }

    try {
      isCompletingRef.current = true;
      const currentUser = auth().currentUser;

      if (!currentUser) {
        console.log('Unable to complete onboarding: missing user id');
        isCompletingRef.current = false;
        return;
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .set({ onboarded: true }, { merge: true });
      dispatch(setUserOnboarded(true));
    } catch (e) {
      console.log(e);
      isCompletingRef.current = false;
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={[styles.slide, { width }]}>
      {item.svg && <item.svg {...item.svgProps} />}
      {item.icon && <Ionicons name={item.icon} size={120} color="#fff" style={styles.slideIcon} />}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {item.button && (
        <CustomButton
          buttonStyle={{
            backgroundColor: '#fff',
            position: 'absolute',
            bottom: 70,
          }}
          textStyle={{ color: lightTheme.primary, fontWeight: '600' }}
          underlayColor="#dadada"
          onPress={onPress}
          title="Start tracking"
          title={isReplay ? 'Back to profile' : 'Start tracking'}
        />
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

      <Animated.View style={[styles.swipeHint, swipeHintAnimatedStyle]} pointerEvents="none">
        <Text style={styles.swipeHintText}>Swipe</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </Animated.View>

      {isReplay && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close onboarding"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideIcon: {
    marginBottom: 10,
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
  swipeHint: {
    position: 'absolute',
    right: 24,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    opacity: 0.88,
  },
  swipeHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 42,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});

export default OnboardingScreen;
