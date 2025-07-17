import { useEffect, useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar, Platform } from 'react-native';
import { useTheme } from '../theme/themeContext';
import ItemsScreen from '../screens/ItemsScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import CustomTabBar from './CustomTabBar';
import { useTabFocus } from '../components/tabFocusContext';

const Tab = createMaterialTopTabNavigator();

const ItemTabs = ({ myIndex }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  const colors = useTheme();
  const tabFocused = useTabFocus(myIndex);
  const screenFocused = useIsFocused();

  useEffect(() => {
    if (!tabFocused || !screenFocused) return;

    const color = tabIndex === 0 ? colors.primary : colors.primaryDark;

    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(false);
      StatusBar.setBackgroundColor(color);
    }
    StatusBar.setBarStyle('light-content');
  }, [tabFocused, screenFocused, tabIndex, colors]);

  const renderItemsScreen = (props) => (
    <ItemsScreen {...props} selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
  );

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} hidden={selectedItems.length > 0} />}
      screenOptions={{ swipeEnabled: true }}
      screenListeners={{
        state: (e) => {
          const i = e.data.state.index;
          setTabIndex(i);
        },
      }}
    >
      <Tab.Screen name="Items" children={renderItemsScreen} />
      <Tab.Screen name="Collections" component={CollectionsScreen} />
    </Tab.Navigator>
  );
};

export default ItemTabs;
