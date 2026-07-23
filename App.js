import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import AuthStackNav from './src/navigation/AuthStackNav';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { lightTheme } from './src/theme/colors';
import SplashScreen from 'react-native-splash-screen';
import MainStackNav from './src/navigation/MainStackNav';
import OnboardingScreen from './src/screens/OnboardingScreen';
import store from './src/redux/store';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { getUserOnboardingStatus } from './src/utils/firebase';
import { getGuestData } from './src/utils/guestStorage';
import { setCollections, setPurchases } from './src/redux/actions/purchaseActions';
import { setCustomCategories, setUser, setUserOnboarded } from './src/redux/actions/userActions';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme/themeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const userOnboardedRef = useRef(false);

  const userOnboarded = useSelector((state) => state.user.userOnboarded);
  const localUser = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    userOnboardedRef.current = userOnboarded;

    if (userOnboarded && auth().currentUser) {
      setIsAuthenticated(auth().currentUser);
    }
    setIsGuest(!auth().currentUser && localUser?.isGuest === true);

    setIsOnboarded(userOnboarded);
  }, [localUser, userOnboarded]);

  useEffect(() => {
    if (SplashScreen) {
      SplashScreen.hide();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setLoading(true);

      if (user) {
        const guestData = await getGuestData();
        if (guestData.active && guestData.pendingAuthUid === user.uid) {
          dispatch(setUser(guestData.userData));
          dispatch(setPurchases(guestData.purchases));
          dispatch(setCollections(guestData.collections));
          dispatch(setCustomCategories(guestData.customCategories));
          dispatch(setUserOnboarded(guestData.userData?.onboarded === true));
          setIsAuthenticated(user);
          setIsOnboarded(guestData.userData?.onboarded === true);
          setIsGuest(false);
          setLoading(false);
          return;
        }

        const onboarded = await getUserOnboardingStatus(user.uid);
        setIsAuthenticated(user);
        setIsGuest(false);
        setIsOnboarded(onboarded);
      } else {
        const guestData = await getGuestData();
        const hasActiveGuest = guestData.active && guestData.userData?.isGuest === true;
        setIsAuthenticated(false);
        setIsGuest(hasActiveGuest);
        setIsOnboarded(hasActiveGuest && guestData.userData?.onboarded === true);

        if (hasActiveGuest) {
          dispatch(setUser(guestData.userData));
          dispatch(setPurchases(guestData.purchases));
          dispatch(setCollections(guestData.collections));
          dispatch(setCustomCategories(guestData.customCategories));
          dispatch(setUserOnboarded(guestData.userData?.onboarded === true));
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

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
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar backgroundColor={lightTheme.primary} barStyle="light-content" />
        {!isAuthenticated && !isGuest ? (
          <AuthStackNav />
        ) : isOnboarded || userOnboarded ? (
          <MainStackNav />
        ) : (
          <OnboardingScreen route={{ params: {} }} />
        )}
      </NavigationContainer>
    </View>
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
