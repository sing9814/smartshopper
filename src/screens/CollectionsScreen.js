import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';
import AddButton from '../components/addButton';

const CollectionsScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  return (
    <View style={styles.container}>
      <AddButton
        onPress={() => navigation.navigate('AddCollection')}
        scale={1.5}
        style={styles.button}
      ></AddButton>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    button: {
      position: 'absolute',
      bottom: 80,
      right: 20,
    },
  });

export default CollectionsScreen;
