import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/themeContext';
import BottomSheet from './bottomSheet';

const MultiSelectFilterSheet = ({
  visible,
  onClose,
  title,
  allLabel,
  options,
  selectedValues,
  onChange,
  getLabel = (option) => option,
  getValue = (option) => option,
  renderLeading,
  height = 480,
}) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const toggleValue = (value) => {
    onChange((current) =>
      current.includes(value)
        ? current.filter((selectedValue) => selectedValue !== value)
        : [...current, value]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} height={height}>
      <View style={styles.header}>
        <Text style={styles.count}>
          {selectedValues.length === 0 ? allLabel : `${selectedValues.length} selected`}
        </Text>
        {selectedValues.length > 0 && (
          <TouchableOpacity onPress={() => onChange([])}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option) => {
          const label = getLabel(option);
          const value = getValue(option);
          const isSelected = selectedValues.includes(value);

          return (
            <TouchableOpacity
              key={value}
              style={styles.option}
              onPress={() => toggleValue(value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`Filter by ${label}`}
            >
              <View style={styles.optionLeft}>
                {renderLeading?.(option)}
                <Text style={styles.optionText}>{label}</Text>
              </View>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={isSelected ? colors.primary : colors.gray}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    header: {
      width: '100%',
      minHeight: 40,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
    },
    count: {
      color: colors.gray,
      fontSize: 13,
    },
    clearText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    list: {
      width: '100%',
      flex: 1,
      paddingTop: 6,
    },
    listContent: {
      paddingBottom: 110,
    },
    option: {
      width: '100%',
      minHeight: 48,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.bg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.white,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    optionText: {
      color: colors.black,
      fontWeight: '500',
    },
  });

export default MultiSelectFilterSheet;
