import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailsScreen from '../screens/DetailsScreen';
import MainTabNav from './MainTabNav';
import EditScreen from '../screens/EditScreen';
import CustomCategoriesScreen from '../screens/CustomCategoriesScreen';

const Stack = createNativeStackNavigator();

function MainStackNav() {
  return (
    <Stack.Navigator initialRouteName="Tabs">
      <Stack.Screen name="Tabs" component={MainTabNav} options={{ headerShown: false }} />
      <Stack.Screen
        name="Edit"
        component={EditScreen}
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="CustomCategory"
        component={CustomCategoriesScreen}
        options={{ headerShown: false, animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}

export default MainStackNav;
