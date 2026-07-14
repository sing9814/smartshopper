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
import {
  DEFAULT_FOLDER_COLOR,
  getCollectionFolderBackground,
  getCollectionFolderColor,
} from '../utils/collectionColor';

const CollectionsScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBar(colors.primaryDark);

  const dispatch = useDispatch();
  const collections = useSelector((state) => state.purchase.collections);
  const purchases = useSelector((state) => state.purchase.purchases);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [selectedFolderColorName, setSelectedFolderColorName] = useState(DEFAULT_FOLDER_COLOR);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [banner, setBanner] = useState(null);
  const selectedFolderColor =
    colors.itemColorOptions.find((option) => option.name === selectedFolderColorName) ||
    colors.itemColorOptions[0];

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
    setSelectedFolderColorName(DEFAULT_FOLDER_COLOR);
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
        folderColor: selectedFolderColor,
        dateCreated: generateFirestoreTimestamp(),
      };

      await userRef.collection('Collections').doc(id).set(newCollection);
      dispatch(setCollections([newCollection, ...collections]));
      setCollectionName('');
      setSelectedFolderColorName(DEFAULT_FOLDER_COLOR);
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
    const itemCount = itemNames.length;
    const folderColor = getCollectionFolderColor(item.folderColor, colors);
    const previewText =
      itemCount > 0
        ? `${itemNames.slice(0, 3).join(', ')}${itemCount > 3 ? ` + ${itemCount - 3} more` : ''}`
        : 'No items yet';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('CollectionDetail', { collection: item, animationEnabled: false })
        }
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getCollectionFolderBackground(item.folderColor, colors) },
          ]}
        >
          <Ionicons name="folder-outline" size={23} color={folderColor} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemCount}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <Text
            style={[styles.description, itemCount > 0 && styles.populatedDescription]}
            numberOfLines={1}
          >
            {previewText}
          </Text>
        </View>
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
        height={350}
      >
        <View style={styles.sheetContent}>
          <CustomInput
            placeholder="Enter collection name"
            value={collectionName}
            onChangeText={setCollectionName}
          />

          <View>
            <View style={styles.colorSelectionRow}>
              <View style={styles.folderPreview}>
                <View
                  style={[
                    styles.previewIconContainer,
                    {
                      backgroundColor: getCollectionFolderBackground(selectedFolderColor, colors),
                    },
                  ]}
                >
                  <Ionicons name="folder-outline" size={27} color={selectedFolderColor.hex} />
                </View>
              </View>

              <View style={styles.colorOptions}>
                {colors.itemColorOptions.map((option) => {
                  const isSelected = option.name === selectedFolderColorName;

                  return (
                    <TouchableOpacity
                      key={option.name}
                      style={[styles.colorOption, isSelected && styles.colorOptionSelected]}
                      onPress={() => setSelectedFolderColorName(option.name)}
                      accessibilityRole="button"
                      accessibilityLabel={`${option.name} folder color`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor: option.hex,
                            borderColor:
                              option.name === 'White' || option.name === 'Black'
                                ? colors.lightGrey
                                : option.hex,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

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
      minHeight: 88,
      backgroundColor: colors.white,
      marginHorizontal: 12,
      marginBottom: 10,
      paddingVertical: 15,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 12,
      elevation: 1,
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBody: {
      flex: 1,
      gap: 7,
      marginRight: 10,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.black,
    },
    itemCount: {
      color: colors.gray,
      fontSize: 13,
    },
    description: {
      fontSize: 13,
      color: colors.placeholder,
      lineHeight: 18,
    },
    populatedDescription: {
      color: colors.black,
      opacity: 0.8,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: 2,
    },
    flatlist: {
      paddingTop: 12,
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
      gap: 16,
      paddingTop: 8,
      paddingBottom: 64,
    },
    folderPreview: {
      width: 66,
      minHeight: 66,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorSelectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    colorOptions: {
      width: 212,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorOptionSelected: {
      borderColor: colors.primary,
    },
    colorSwatch: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
    },
    createButton: {
      backgroundColor: colors.primaryDark,
    },
  });

export default CollectionsScreen;
