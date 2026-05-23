import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/themeContext';

const Header = ({ title, subtitle, rounded, padding, style, rightComponent }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, rounded && styles.rounded, padding && styles.padding, style]}>
      <View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {rightComponent}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    title: {
      flex: 1,
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
      paddingTop: 4,
      paddingBottom: 24,
      paddingHorizontal: 24,
    },
  });

export default Header;
