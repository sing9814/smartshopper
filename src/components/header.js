import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/themeContext';

const Header = ({ title, subtitle, rounded, padding, style, titleStyle, rightComponent }) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  return (
    <View style={[styles.container, rounded && styles.rounded, padding && styles.padding, style]}>
      <View>
        <View style={styles.titleRow}>
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          {rightComponent}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const createStyles = (colors, topInset) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: colors.primary,
      gap: 6,
      paddingTop: topInset + 10,
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
      paddingTop: 6,
    },
    rounded: {
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    padding: {
      paddingTop: topInset + 4,
      paddingBottom: 24,
      paddingHorizontal: 24,
    },
  });

export default Header;
