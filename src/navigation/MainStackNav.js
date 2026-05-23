import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailsScreen from '../screens/DetailsScreen';
import MainTabNav from './MainTabNav';

const Stack = createNativeStackNavigator();

function MainStackNav() {
  return (
    <Stack.Navigator initialRouteName="Tabs">
      <Stack.Screen name="Tabs" component={MainTabNav} options={{ headerShown: false }} />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export default MainStackNav;
