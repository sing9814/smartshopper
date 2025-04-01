import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.4;
const DISMISS_THRESHOLD = 100;

export default function BottomSheet({ visible, onClose, children }) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(0.3, { duration: 200 });
      translateY.value = withSpring(0);
    } else {
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animateAndClose = () => {
    'worklet';
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SHEET_HEIGHT, {}, () => {
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
        animateAndClose();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backdropOpacity.value})`,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, backdropStyle]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          animateAndClose();
        }}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SHEET_HEIGHT,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
});
