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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { setUserOnboarded } from '../redux/actions/userActions';
import Logo from '../../assets/logo';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setLocalGuestOnboarded } from '../utils/guestStorage';
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

const PaginationDot = ({ index, scrollX, width, onPress }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const dotWidth = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [10, 20, 10],
      'clamp'
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.6, 1, 0.6],
      'clamp'
    );
    return { width: dotWidth, opacity };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={`Go to onboarding step ${index + 1}`}
      style={styles.dotButton}
    >
      <Animated.View style={[styles.dot, animatedDotStyle]} />
    </TouchableOpacity>
  );
};

const OnboardingScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const scrollX = useSharedValue(0);
  const isCompletingRef = useRef(false);
  const { isReplay = false } = route.params || {};
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
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
      description: 'Build a more sustainable wardrobe by wearing more of what you already own',
    },
    {
      colors: [lightTheme.primary, lightTheme.primaryDark],
      diagonal: true,
      icon: 'shirt-outline',
      title: 'Set an intention',
      description: 'Add your clothes and give each item a personal wear goal to work toward',
    },
    {
      colors: [lightTheme.primaryDark, lightTheme.secondary],
      icon: 'calendar-outline',
      title: 'Count every wear',
      description: 'Log what you wear and see each item move closer to its goal',
    },
    {
      colors: [lightTheme.secondary, lightTheme.primary],
      icon: 'layers-outline',
      title: 'Wear more together',
      description: 'Create collections from items you wear together and log them all in one tap',
    },
    {
      colors: [lightTheme.primary, lightTheme.primaryDark],
      diagonal: true,
      icon: 'analytics-outline',
      title: 'Know what needs a wear',
      description: "See what's unworn, in progress, and which items have reached their goal",
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
        await setLocalGuestOnboarded(true);
        dispatch(setUserOnboarded(true));
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

  const scrollToSlide = (index) => {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      onPress();
      return;
    }

    scrollToSlide(activeIndex + 1);
  };

  const handleMomentumScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(nextIndex, slides.length - 1)));
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      {item.svg && <item.svg {...item.svgProps} />}
      {item.icon && <Ionicons name={item.icon} size={120} color="#fff" style={styles.slideIcon} />}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
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
        ref={listRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        keyExtractor={(item) => item.title}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        initialNumToRender={1}
        windowSize={2}
        maxToRenderPerBatch={2}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={[styles.paginator, { bottom: 82 + insets.bottom }]}>
        {slides.map((_, i) => (
          <PaginationDot
            key={i}
            index={i}
            scrollX={scrollX}
            width={width}
            onPress={() => scrollToSlide(i)}
          />
        ))}
      </View>

      <View style={[styles.controls, { bottom: 24 + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.arrowButton, activeIndex === 0 && styles.hiddenControl]}
          onPress={() => scrollToSlide(activeIndex - 1)}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Previous onboarding step"
          disabled={activeIndex === 0}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={activeIndex === slides.length - 1 ? styles.startButton : styles.arrowButtonPrimary}
          onPress={handleNext}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={
            activeIndex === slides.length - 1
              ? isReplay
                ? 'Back to profile'
                : 'Start tracking'
              : 'Next onboarding step'
          }
        >
          {activeIndex === slides.length - 1 ? (
            <Text style={styles.startButtonText}>{isReplay ? 'Done' : 'Start'}</Text>
          ) : (
            <Ionicons name="chevron-forward" size={26} color={lightTheme.primary} />
          )}
        </TouchableOpacity>
      </View>

      {!isReplay && activeIndex < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onPress}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}

      {isReplay && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={1}
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
    paddingBottom: 92,
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
    bottom: 82,
    flexDirection: 'row',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  controls: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  arrowButtonPrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  hiddenControl: {
    opacity: 0,
  },
  startButton: {
    height: 48,
    minWidth: 92,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  startButtonText: {
    color: lightTheme.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    position: 'absolute',
    top: 42,
    right: 20,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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
