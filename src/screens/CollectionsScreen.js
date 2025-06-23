import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';
import AddButton from '../components/addButton';
import { useSelector } from 'react-redux';

const CollectionsScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  const collections = useSelector((state) => state.purchase.collections);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CollectionDetail', { collection: item })}
    >
      <Text style={styles.title}>{item.name}</Text>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.flatlist}
      />

      <AddButton
        onPress={() => navigation.navigate('AddCollection')}
        scale={1.5}
        style={styles.button}
      />
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 16,
      borderRadius: 12,
      shadowColor: colors.black,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.black,
    },
    description: {
      fontSize: 14,
      color: colors.gray,
      marginTop: 4,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flatlist: {
      paddingBottom: 120,
      paddingTop: 12,
    },
    button: {
      position: 'absolute',
      bottom: 80,
      right: 20,
    },
  });

export default CollectionsScreen;
