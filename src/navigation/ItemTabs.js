import { useState, useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import ItemsScreen from '../screens/ItemsScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import CustomTabBar from './CustomTabBar';

const Tab = createMaterialTopTabNavigator();

const ItemTabs = () => {
  const [selectedItems, setSelectedItems] = useState([]);

  const renderItemsScreen = useCallback(
    (props) => (
      <ItemsScreen {...props} selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
    ),
    [selectedItems, setSelectedItems]
  );

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} hidden={selectedItems.length > 0} />}
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Items" children={renderItemsScreen} options={{ tabBarLabel: 'Wardrobe' }} />
      <Tab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{ tabBarLabel: 'Outfits' }}
      />
    </Tab.Navigator>
  );
};

export default ItemTabs;
