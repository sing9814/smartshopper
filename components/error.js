import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import colors from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Error = ({ title }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.white} />
      <Text style={styles.text}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  text: {
    color: colors.white,
    paddingVertical: 15,
    fontWeight: '400',
  },
});

export default Error;
