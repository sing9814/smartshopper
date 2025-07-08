import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ItemTabs from './ItemTabs';
import AddCollectionScreen from '../screens/AddCollectionScreen';
import CollectionDetailScreen from '../screens/CollectionsDetailsScreen';
import DetailsScreen from '../screens/DetailsScreen';
import EditScreen from '../screens/EditScreen';

const Stack = createNativeStackNavigator();

const ItemStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ItemTabs" component={ItemTabs} />
    <Stack.Screen name="AddCollection" component={AddCollectionScreen} />
    <Stack.Screen
      name="CollectionDetail"
      component={CollectionDetailScreen}
      options={{ headerShown: false, animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="Details"
      component={DetailsScreen}
      options={{ headerShown: false, animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="Edit"
      component={EditScreen}
      options={{ headerShown: false, animation: 'fade' }}
    />
  </Stack.Navigator>
);

export default ItemStack;
