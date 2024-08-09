import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import PurchaseHistoryScreen from '../screens/PurchaseHistoryScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import AddPurchaseScreen from '../screens/AddPurchaseScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

function MainTabNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#fff',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          height: 60,
        },
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.lightGrey,
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add') {
            iconName = focused ? 'add' : 'add-outline';
          } else if (route.name === 'Purchases') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add" component={AddPurchaseScreen} />
      <Tab.Screen name="Purchases" component={PurchaseHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default MainTabNav;
