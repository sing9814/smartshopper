import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
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
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    </AuthStack.Navigator>
  );
}

export default AuthStackNav;
