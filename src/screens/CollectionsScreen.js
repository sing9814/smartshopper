import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';

const CollectionsScreen = () => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  return <View style={styles.container}></View>;
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
  });

export default CollectionsScreen;
