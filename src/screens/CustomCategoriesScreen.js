import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/themeContext';
import { useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const CustomCategoriesScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const customCategories = useSelector((state) => state.user.customCategories);

  const renderItem = ({ item }) => (
    <View style={styles.categoryRow}>
      <View style={[styles.pill, { backgroundColor: colors[item.category.split(' ')[0]] }]}>
        <Text style={styles.pillText}>{item.name}</Text>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <FlatList
          data={customCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </View>
    </>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.bg,
    },
    topbar: {
      width: '100%',
      backgroundColor: colors.primary,
      gap: 6,
      paddingTop: 10,
      paddingBottom: 13,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      justifyContent: 'space-between',
    },
    pill: {
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    pillText: {
      color: colors.white,
    },
  });

export default CustomCategoriesScreen;
