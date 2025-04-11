import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import colors from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Error = ({ title, margin = true }) => {
  return (
    <View style={[styles.container, margin && { marginTop: 12 }]}>
      <Ionicons name="alert-circle-outline" size={20} color="white" />
      <Text style={styles.text}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    flexDirection: 'row',
    paddingVertical: 15,
    gap: 5,
    elevation: 1,
    borderRadius: 10,
  },
  text: {
    color: 'white',
    marginLeft: 3,
    marginRight: 25,
    lineHeight: 22,
  },
});

export default Error;
