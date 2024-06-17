import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';

const ConfirmationPopup = ({ visible, message }) => {
  const posAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(posAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(posAnim, {
            toValue: -50,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2000);
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: posAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.green,
    padding: 15,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 15,
    gap: 5,
    elevation: 1,
    borderRadius: 10,
    marginHorizontal: 12,
    flexDirection: 'row',
    marginTop: 10,
  },
  message: {
    color: 'white',
    marginLeft: 3,
    marginRight: 25,
    fontWeight: '400',
    fontSize: 15,
  },
});

export default ConfirmationPopup;
