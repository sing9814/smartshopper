import { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '../theme/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Banner = ({ message, onFinish, onPress, type = 'error' }) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(insets.top);
  const [visible, setVisible] = useState(true);
  const onFinishRef = useRef(onFinish);

  onFinishRef.current = onFinish;

  const backgroundColor = type === 'error' ? colors.red : colors.green;
  const iconName = type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline';

  useEffect(() => {
    setVisible(true);

    const timeout = setTimeout(() => {
      setVisible(false);
      onFinishRef.current?.();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [message]);

  if (!visible || !message) return null;

  const content = (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutUp.duration(150)}
      style={[styles.banner, { backgroundColor }]}
      accessibilityRole={type === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={iconName} size={20} color="white" />
      <Text style={styles.text} numberOfLines={3}>
        {message}
      </Text>
      {onPress && <Ionicons name="chevron-forward" size={18} color="white" />}
    </Animated.View>
  );

  if (!onPress) {
    return (
      <View pointerEvents="none" style={styles.container}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.container}>
      {content}
    </TouchableOpacity>
  );
};

const createStyles = (topInset) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: topInset + 8,
      left: 16,
      right: 16,
      zIndex: 1000,
      elevation: 20,
    },
    banner: {
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
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
