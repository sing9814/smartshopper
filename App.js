import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import AuthStackNav from './src/navigation/AuthStackNav';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import colors from './src/utils/colors';
import SplashScreen from 'react-native-splash-screen';
import MainStackNav from './src/navigation/MainStackNav';
import store from './src/redux/store';
import { Provider, useSelector } from 'react-redux';
import { userExists } from './src/utils/firebase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = useSelector((state) => state.user.userOnboarded);

  useEffect(() => {
    setIsOnboarded(user);
  }, [user]);

  useEffect(() => {
    if (SplashScreen) {
      SplashScreen.hide();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(user);
        const onboarded = await userExists(user.uid);
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
          backgroundColor: colors.primary,
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      {isAuthenticated && isOnboarded ? <MainStackNav /> : <AuthStackNav />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppWrapper />
      </GestureHandlerRootView>
    </Provider>
  );
}

// npm start
