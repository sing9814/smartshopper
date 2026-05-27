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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('CollectionDetail', { collection: item, animationEnabled: false })
      }
    >
      <View style={styles.collectionIcon}>
        <Ionicons name="albums-outline" size={20} color={colors.primary} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {item.items.length} {item.items.length !== 1 ? 'items' : 'item'}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.gray} />
    </TouchableOpacity>
  );

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
      marginBottom: 2,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    collectionIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
    },
    cardBody: {
      flex: 1,
      gap: 5,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.black,
    },
    countPill: {
      minHeight: 24,
      paddingHorizontal: 9,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
    },
    countText: {
      color: colors.gray,
      fontSize: 12,
      fontWeight: '600',
    },
    description: {
      fontSize: 14,
      color: colors.gray,
      lineHeight: 19,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: 6,
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
