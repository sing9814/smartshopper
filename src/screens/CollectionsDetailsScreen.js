import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useSelector } from 'react-redux';
import PurchaseList from '../components/purchaseList';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { setCollections } from '../redux/actions/purchaseActions';
import { deleteDoc } from '../utils/firebase';
import { useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Banner from '../components/banner';
import ConfirmationModal from '../components/confirmationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBarWhenFullyFocused } from '../hooks/useStatusBarWhenFocused';

const CollectionDetailScreen = ({ route, navigation }) => {
  const { collection } = route.params;
  const colors = useTheme();
  const styles = createStyles(colors);
  useStatusBarWhenFullyFocused(2, colors.primaryDark);

  const [banner, setBanner] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const checkDismissed = async () => {
      const dismissed = await AsyncStorage.getItem('messageDismissed');
      if (dismissed !== 'true') setShowMessage(true);
    };
    checkDismissed();
  }, []);

  const handleDismissTip = async () => {
    setShowMessage(false);
    await AsyncStorage.setItem('messageDismissed', 'true');
  };

  const showBanner = (message, type = 'error') => {
    setBanner(null);
    setTimeout(() => {
      setBanner({ message, type });
    }, 10);
  };

  const dispatch = useDispatch();
  const collections = useSelector((state) => state.purchase.collections);
  const purchases = useSelector((state) => state.purchase.purchases);

  const itemsInCollection = purchases.filter((item) => collection.items.includes(item.key));

  const confirmDeleteCollection = async () => {
    try {
      await deleteDoc('Collections', collection.id);

      const updated = collections.filter((c) => c.id !== collection.id);
      dispatch(setCollections(updated));

      setModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      showBanner('Failed to delete collection');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {banner && (
        <Banner message={banner.message} type={banner.type} onFinish={() => setBanner(null)} />
      )}
      <ConfirmationModal
        visible={modalVisible}
        onConfirm={confirmDeleteCollection}
        onCancel={() => setModalVisible(false)}
        data={`"${collection.name}"`}
      />
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="trash-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.innerContainer}>
        <Text style={styles.name}>{collection.name}</Text>
        {collection.description ? (
          <Text style={styles.description}>{collection.description}</Text>
        ) : null}
        <View style={styles.line}></View>
        {showMessage && itemsInCollection.length === 0 && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Long press items on the "Items" tab to add them to this collection.
            </Text>
            <TouchableOpacity onPress={handleDismissTip}>
              <Ionicons name="close" size={18} color={colors.gray} />
            </TouchableOpacity>
          </View>
        )}

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
    line: {
      backgroundColor: colors.bg,
      height: 1,
      width: '100%',
      marginVertical: 10,
    },
    messageContainer: {
      backgroundColor: colors.bg,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    messageText: {
      color: colors.gray,
      flex: 1,
      paddingRight: 10,
      lineHeight: 22,
    },
  });

export default CollectionDetailScreen;
