import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ItemTabs from './ItemTabs';
import AddCollectionScreen from '../screens/AddCollectionScreen';

const Stack = createNativeStackNavigator();

const ItemStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ItemTabs" component={ItemTabs} />
    <Stack.Screen name="AddCollection" component={AddCollectionScreen} />
  </Stack.Navigator>
);

export default ItemStack;
