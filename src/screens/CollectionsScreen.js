import { useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import uuid from 'react-native-uuid';
import { useTheme } from '../theme/themeContext';
import { useStatusBar } from '../hooks/useStatusBar';
import AddButton from '../components/addButton';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomSheet from '../components/bottomSheet';
import CustomInput from '../components/customInput';
import CustomButton from '../components/button';
import Banner from '../components/banner';
import { setCollections } from '../redux/actions/purchaseActions';
import { generateFirestoreTimestamp } from '../utils/date';

const CollectionsScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  const dispatch = useDispatch();
  const collections = useSelector((state) => state.purchase.collections);
  const purchases = useSelector((state) => state.purchase.purchases);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [banner, setBanner] = useState(null);

  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  const closeCreateSheet = () => {
    if (isCreatingCollection) return;

    setCreateSheetVisible(false);
    setCollectionName('');
  };

  const createCollection = async () => {
    const trimmedName = collectionName.trim();

    if (!trimmedName) {
      showBanner('Please enter a name for your collection.');
      return;
    }

    setIsCreatingCollection(true);

    try {
      const userRef = firestore().collection('users').doc(auth().currentUser.uid);
      const id = uuid.v4();
      const newCollection = {
        id,
        name: trimmedName,
        items: [],
        dateCreated: generateFirestoreTimestamp(),
      };

      await userRef.collection('Collections').doc(id).set(newCollection);
      dispatch(setCollections([newCollection, ...collections]));
      setCollectionName('');
      setCreateSheetVisible(false);
      showBanner('Collection created!', 'success');
    } catch (error) {
      console.error('Error adding collection:', error);
      showBanner('An error occurred while creating the collection.');
    } finally {
      setIsCreatingCollection(false);
    }
  };

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
      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.flatlist, collections.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="sad-outline"
              size={34}
              color={colors.primary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <Text style={styles.emptyText}>Create collections to organize your items</Text>
          </View>
        }
      />

      <AddButton onPress={() => setCreateSheetVisible(true)} scale={1.5} style={styles.button} />

      <BottomSheet
        visible={createSheetVisible}
        onClose={closeCreateSheet}
        title="Create collection"
        height={310}
      >
        <View style={styles.sheetContent}>
          <CustomInput
            placeholder="Enter collection name"
            value={collectionName}
            onChangeText={setCollectionName}
          />
          <CustomButton
            title={isCreatingCollection ? 'Creating...' : 'Create'}
            onPress={createCollection}
            disabled={isCreatingCollection}
            buttonStyle={styles.createButton}
          />
        </View>
      </BottomSheet>
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
      marginBottom: 14,
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
    sheetContent: {
      width: '100%',
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingBottom: 120,
    },
    createButton: {
      backgroundColor: colors.primaryDark,
    },
  });

export default CollectionsScreen;
