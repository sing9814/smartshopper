import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/themeContext';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tab, isFocused && styles.activeTab]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isFocused ? 'white' : '#aaa',
                  fontSize: 16,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  label: {
    fontSize: 14,
    letterSpacing: 1,
  },
});

export default CustomTabBar;
