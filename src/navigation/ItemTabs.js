import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import ItemsScreen from '../screens/ItemsScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import CustomTabBar from './CustomTabBar';

const Tab = createMaterialTopTabNavigator();

const ItemTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Items" component={ItemsScreen} />
      <Tab.Screen name="Collections" component={CollectionsScreen} />
    </Tab.Navigator>
  );
};

export default ItemTabs;
