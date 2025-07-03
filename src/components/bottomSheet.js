import { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '../theme/themeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.4;
const DISMISS_THRESHOLD = 100;
const SHEET_OFFSET = 40;

const BottomSheet = ({ title, visible, onClose, height = '40%', children }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  // Convert % string or number to a pixel value
  const resolvedHeight = useMemo(() => {
    if (typeof height === 'string' && height.endsWith('%')) {
      const percent = parseFloat(height) / 100;
      return SCREEN_HEIGHT * percent;
    }
    return typeof height === 'number' ? height : DEFAULT_HEIGHT;
  }, [height]);

  const translateY = useSharedValue(resolvedHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(0.3, { duration: 200, reduceMotion: 'never' });
      translateY.value = withSpring(SHEET_OFFSET, {
        damping: 15,
        stiffness: 130,
        reduceMotion: 'never',
      });
    } else {
      translateY.value = resolvedHeight + SHEET_OFFSET;
      backdropOpacity.value = withTiming(0, { duration: 200, reduceMotion: 'never' });
    }
  }, [visible, resolvedHeight]);

  const closeSheet = () => {
    'worklet';
    backdropOpacity.value = withTiming(0, { duration: 200, reduceMotion: 'never' });
    translateY.value = withTiming(resolvedHeight + SHEET_OFFSET, { reduceMotion: 'never' }, () => {
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const nextY = event.translationY + SHEET_OFFSET;
      if (nextY >= 0) {
        translateY.value = nextY;
      }
    })
    .onEnd(() => {
      if (translateY.value > DISMISS_THRESHOLD) {
        closeSheet();
      } else {
        translateY.value = withSpring(SHEET_OFFSET, {
          damping: 18,
          stiffness: 250,
          reduceMotion: 'never',
        });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backdropOpacity.value})`,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: resolvedHeight + SHEET_OFFSET,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, backdropStyle]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          runOnJS(closeSheet)();
        }}
      />
      <Animated.View style={[styles.sheet, sheetStyle]} onStartShouldSetResponder={() => true}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.draggableContainer}>
            <Animated.View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
          </View>
        </GestureDetector>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      justifyContent: 'flex-end',
    },
    sheet: {
      width: '100%',
      backgroundColor: colors.white,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 10,
      alignItems: 'center',
      // overflow: 'hidden',
      paddingHorizontal: 16,
    },
    draggableContainer: {
      width: '100%',
      alignItems: 'center',
    },
    handle: {
      width: 50,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.lightGrey,
      marginBottom: 10,
    },
    title: {
      alignSelf: 'center',
      color: colors.gray,
      paddingBottom: 8,
    },
  });

export default BottomSheet;
