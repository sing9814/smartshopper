import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import colors from '../utils/colors';

const ProgressBar = ({ budget, spent }) => {
  const [progress] = useState(new Animated.Value(0));

  const percentageSpent = Math.min((spent / budget) * 100, 100);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentageSpent,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percentageSpent, spent]);

  const getProgressColor = () => {
    if (percentageSpent < 50) {
      return '#4caf50';
    } else if (percentageSpent < 80) {
      return '#ffeb3b';
    } else {
      return '#f44336';
    }
  };

  const animatedStyle = {
    width: progress.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    }),
    backgroundColor: getProgressColor(),
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBarBackground}>
        <Animated.View style={[styles.progressBar, animatedStyle]} />
      </View>
      <Text style={styles.label}>{`${Math.round(
        percentageSpent
      )}% ($${spent}) of your budget used `}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  label: {
    fontSize: 15,
    marginTop: 12,
    color: colors.black,
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 15,
    justifyContent: 'center',
  },
});

export default ProgressBar;
