import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

const AuthStack = createNativeStackNavigator();

function AuthStackNav() {
  return (
    <AuthStack.Navigator
      screenOptions={() => ({
        headerShown: false,
      })}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

export default AuthStackNav;
