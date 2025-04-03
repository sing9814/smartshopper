import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import colors from '../utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.4;
const DISMISS_THRESHOLD = 100;

const BottomSheet = ({ title, visible, onClose, height = '40%', children }) => {
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
      backdropOpacity.value = withTiming(0.3, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 250,
      });
    } else {
      translateY.value = resolvedHeight;
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, resolvedHeight]);

  const closeSheet = () => {
    'worklet';
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(resolvedHeight, {}, () => {
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (translateY.value > DISMISS_THRESHOLD) {
        closeSheet();
      } else {
        translateY.value = withSpring(0, {
          damping: 18,
          stiffness: 250,
        });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backdropOpacity.value})`,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: resolvedHeight,
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
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]} onStartShouldSetResponder={() => true}>
          <Animated.View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    alignItems: 'center',
    // overflow: 'hidden',
    paddingHorizontal: 16,
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  title: {
    alignSelf: 'center',
    color: colors.gray,
    paddingBottom: 8,
  },
});

export default BottomSheet;
