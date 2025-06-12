import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/themeContext';

const Header = ({ title, subtitle, rounded, padding, style }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, rounded && styles.rounded, padding && styles.padding, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: colors.primary,
      gap: 6,
      paddingTop: 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 18,
      // fontWeight: '500',
      color: 'white',
    },
    subtitle: {
      color: 'white',
    },
    rounded: {
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    padding: {
      paddingTop: 15,
      paddingBottom: 20,
      paddingHorizontal: 30,
    },
  });

export default Header;
