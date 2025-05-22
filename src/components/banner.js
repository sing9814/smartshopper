import { useEffect } from 'react';
import { Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../theme/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const Banner = ({ message, onFinish, type = 'error' }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  console.log(type);

  const backgroundColor = type === 'error' ? colors.red : colors.green;
  const iconName = type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline';

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    if (type === 'success') {
      const timeout = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished && onFinish) {
            runOnJS(onFinish)();
          }
        });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.banner, { backgroundColor }, animatedStyle]}>
      <Ionicons name={iconName} size={20} color="white" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    banner: {
      position: 'absolute',
      top: 20,
      left: 16,
      right: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      zIndex: 999,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    text: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
      lineHeight: 20,
    },
  });

export default Banner;
