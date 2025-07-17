import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { TabView } from 'react-native-tab-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import AddPurchaseScreen from '../screens/AddPurchaseScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ItemStack from './ItemStack';
import { useTheme } from '../theme/themeContext';
import { TabFocusProvider } from '../components/tabFocusContext';

const initialLayout = { width: Dimensions.get('window').width };

function MainTabNav() {
  const colors = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', icon: 'home' },
    { key: 'add', icon: 'add' },
    { key: 'purchases', icon: 'list' },
    { key: 'profile', icon: 'person' },
  ]);

  useEffect(() => {
    if (index === 2) return;

    const statusBarConfig = [
      { color: colors.primary, style: 'light-content' }, // Home
      { color: colors.primary, style: 'light-content' }, // Add
      { color: colors.accent, style: 'light-content' }, // Purchases
      { color: colors.primary, style: 'light-content' }, // Profile
    ];

    const config = statusBarConfig[index];

    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(false);
      StatusBar.setBackgroundColor(config.color);
    }
    StatusBar.setBarStyle(config.style);
  }, [index]);

  const renderScene = ({ route }) => {
    return (
      <TabFocusProvider index={index}>
        {
          {
            home: <HomeScreen myIndex={0} />,
            add: <AddPurchaseScreen myIndex={1} />,
            purchases: <ItemStack myIndex={2} />,
            profile: <ProfileScreen myIndex={3} />,
          }[route.key]
        }
      </TabFocusProvider>
    );
  };

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.white }]}>
      {routes.map((route, i) => {
        const focused = i === index;
        return (
          <TouchableOpacity key={route.key} onPress={() => setIndex(i)} style={styles.tabItem}>
            <Ionicons
              name={focused ? route.icon : `${route.icon}-outline`}
              size={26}
              color={focused ? colors.primary : colors.lightGrey}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={() => null}
        swipeEnabled
      />
      {renderTabBar()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 60,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});

export default MainTabNav;
