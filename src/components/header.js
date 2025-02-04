import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import colors from '../utils/colors';

const Header = ({ title, subtitle, rounded, padding }) => {
  return (
    <View style={[styles.container, rounded && styles.rounded, padding && styles.padding]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.primary,
    gap: 6,
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.white,
  },
  subtitle: {
    color: colors.white,
  },
  rounded: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  padding: {
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 30,
  },
});

export default Header;
