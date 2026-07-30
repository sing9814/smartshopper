import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from './bottomSheet';
import { useTheme } from '../theme/themeContext';

const OptionsSheet = ({ visible, onClose, title, options, height }) => {
  const colors = useTheme();
  const styles = createStyles(colors);
  const resolvedHeight = height ?? (title ? 124 : 94) + options.length * 46;

  const selectOption = (option) => {
    onClose();
    option.onPress();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} height={resolvedHeight}>
      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={option.key ?? option.label}
            style={styles.row}
            onPress={() => selectOption(option)}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
          >
            <View style={styles.icon}>{option.icon}</View>
            <Text style={[styles.text, option.destructive && styles.destructiveText]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    options: {
      width: '100%',
      paddingBottom: 20,
    },
    row: {
      width: '100%',
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      width: 24,
      marginRight: 12,
      alignItems: 'center',
    },
    text: {
      color: colors.black,
      fontSize: 15,
    },
    destructiveText: {
      color: colors.red,
    },
  });

export default OptionsSheet;
