import { Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet from './bottomSheet';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../theme/themeContext';

const DetailsSheet = ({ visible, onClose, navigation, currentPurchase, setModalVisible }) => {
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

  const handleDelete = () => {
    onClose();
    setModalVisible(true);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Options" height={250}>
      <Pressable style={styles.row} onPress={handleEdit}>
        <FontAwesome name="pencil" size={20} color={colors.black} style={styles.icon} />
        <Text style={styles.text}>Edit</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={handleDuplicate}>
        <FontAwesome name="copy" size={20} color={colors.black} style={styles.icon} />
        <Text style={styles.text}>Duplicate</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={handleDelete}>
        <FontAwesome name="trash" size={20} color={colors.red} style={styles.icon} />
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </BottomSheet>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    row: {
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    icon: {
      marginRight: 10,
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
