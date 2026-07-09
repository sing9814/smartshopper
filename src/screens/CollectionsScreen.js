import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';
import AddButton from '../components/addButton';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CollectionsScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  const collections = useSelector((state) => state.purchase.collections);
  const purchases = useSelector((state) => state.purchase.purchases);

  const renderItem = ({ item }) => {
    const collectionItems = item.items || [];
    const itemNames = collectionItems
      .map((itemId) => purchases.find((purchase) => purchase.key === itemId)?.name)
      .filter(Boolean);
    const previewText =
      itemNames.length > 0
        ? `${itemNames.slice(0, 3).join(', ')}${
            itemNames.length > 3 ? ` + ${itemNames.length - 3} more` : ''
          }`
        : 'No items added yet';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('CollectionDetail', { collection: item, animationEnabled: false })
        }
      >
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {previewText}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.flatlist, collections.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="albums-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <Text style={styles.emptyText}>Create collections to organize your items</Text>
          </View>
        }
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
      minHeight: 82,
      backgroundColor: colors.white,
      marginBottom: 1,
      paddingVertical: 14,
      paddingHorizontal: 22,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardBody: {
      flex: 1,
      gap: 5,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.black,
    },
    description: {
      fontSize: 14,
      color: colors.gray,
      lineHeight: 24,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: 2,
    },
    flatlist: {
      paddingBottom: 140,
    },
    emptyList: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      marginBottom: 14,
      elevation: 1,
    },
    emptyTitle: {
      color: colors.black,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 10,
      textAlign: 'center',
    },
    emptyText: {
      color: colors.gray,
      textAlign: 'center',
      lineHeight: 21,
    },
    button: {
      position: 'absolute',
      bottom: 80,
      right: 20,
    },
  });

export default CollectionsScreen;
