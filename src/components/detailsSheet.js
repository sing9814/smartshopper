import { Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet from './bottomSheet';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../theme/themeContext';

const DetailsSheet = ({
  visible,
  onClose,
  navigation,
  currentPurchase,
  setModalVisible,
  isEditingWearHistory,
  onToggleWearHistoryEditing,
}) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const handleEdit = () => {
    onClose();
    navigation.navigate('Edit', { purchase: currentPurchase });
  };

  const handleDuplicate = () => {
    onClose();
    navigation.navigate('Add', {
      purchase: { ...currentPurchase },
    });
  };

  const handleEditWearHistory = () => {
    onClose();
    onToggleWearHistoryEditing();
  };

  const handleDelete = () => {
    onClose();
    setModalVisible(true);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Options" height={320}>
      <Pressable style={styles.row} onPress={handleEdit}>
        <FontAwesome name="pencil" size={20} color={colors.black} style={styles.icon} />
        <Text style={styles.text}>Edit item details</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={handleEditWearHistory}>
        <FontAwesome name="history" size={20} color={colors.black} style={styles.icon} />
        <Text style={styles.text}>
          {isEditingWearHistory ? 'Done editing wear history' : 'Edit wear history'}
        </Text>
      </Pressable>

      <Pressable style={styles.row} onPress={handleDuplicate}>
        <FontAwesome name="copy" size={20} color={colors.black} style={styles.icon} />
        <Text style={styles.text}>Duplicate item</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={handleDelete}>
        <FontAwesome name="trash" size={20} color={colors.red} style={styles.icon} />
        <Text style={styles.deleteText}>Delete item</Text>
      </Pressable>
    </BottomSheet>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    row: {
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    icon: {
      width: 24,
      marginRight: 14,
      textAlign: 'center',
    },
    text: {
      fontSize: 15,
      color: colors.black,
    },
    deleteText: {
      color: colors.red,
      fontSize: 15,
    },
  });

export default DetailsSheet;
