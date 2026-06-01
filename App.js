import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import AuthStackNav from './src/navigation/AuthStackNav';
import {
  StatusBar,
  View,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { lightTheme } from './src/theme/colors';
import SplashScreen from 'react-native-splash-screen';
import MainStackNav from './src/navigation/MainStackNav';
import OnboardingScreen from './src/screens/OnboardingScreen';
import store from './src/redux/store';
import { Provider, useSelector } from 'react-redux';
import { getUserOnboardingStatus } from './src/utils/firebase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme/themeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = auth().currentUser;
  const userOnboardedRef = useRef(false);

  const userOnboarded = useSelector((state) => state.user.userOnboarded);

  useEffect(() => {
    userOnboardedRef.current = userOnboarded;

    if (userOnboarded && auth().currentUser) {
      setIsAuthenticated(auth().currentUser);
    }

    setIsOnboarded(userOnboarded);
  }, [userOnboarded]);

  useEffect(() => {
    if (SplashScreen) {
      SplashScreen.hide();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(user);
        const onboarded = await getUserOnboardingStatus(user.uid);
        setIsOnboarded(onboarded);
      } else {
        setIsAuthenticated(false);
        setIsOnboarded(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: lightTheme.primary,
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <StatusBar backgroundColor={lightTheme.primary} barStyle="light-content" />
          {!isAuthenticated && !currentUser ? (
            <AuthStackNav />
          ) : isOnboarded || userOnboarded ? (
            <MainStackNav />
          ) : (
            <OnboardingScreen route={{ params: {} }} />
          )}
        </NavigationContainer>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppWrapper />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </Provider>
    </ThemeProvider>
  );
}

// npm start
