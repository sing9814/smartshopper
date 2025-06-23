import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useSelector } from 'react-redux';
import PurchaseList from '../components/purchaseList';
import { useStatusBar } from '../hooks/useStatusBar';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const CollectionDetailScreen = ({ route, navigation }) => {
  const { collection } = route.params;
  const colors = useTheme();
  const styles = createStyles(colors);

  useStatusBar(colors.primaryDark);

  const purchases = useSelector((state) => state.purchase.purchases);

  const itemsInCollection = purchases.filter((item) => collection.items.includes(item.key));

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.innerContainer}>
        <Text style={styles.name}>{collection.name}</Text>
        {collection.description ? (
          <Text style={styles.description}>{collection.description}</Text>
        ) : null}

        <PurchaseList
          purchases={itemsInCollection}
          loading={false}
          refreshing={false}
          navigation={navigation}
        />
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    innerContainer: {
      flex: 1,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    topbar: {
      width: '100%',
      backgroundColor: colors.primaryDark,
      gap: 6,
      paddingTop: 10,
      paddingBottom: 13,
      paddingHorizontal: 20,
      marginBottom: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    header: {
      padding: 16,
      margin: 12,
      borderRadius: 12,
      shadowColor: colors.black,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    name: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.black,
    },
    description: {
      fontSize: 14,
      color: colors.gray,
      marginTop: 4,
    },
    addButton: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    addButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default CollectionDetailScreen;
