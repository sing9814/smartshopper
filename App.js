import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import AuthStackNav from './src/navigation/AuthStackNav';
import { StatusBar } from 'react-native';
import colors from './src/utils/colors';
import SplashScreen from 'react-native-splash-screen';
import MainStackNav from './src/navigation/MainStackNav';
import store from './src/redux/store';
import { Provider } from 'react-redux';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (SplashScreen) {
      SplashScreen.hide();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setIsAuthenticated(user);
    });

    return unsubscribe; // Unsubscribe on unmount
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        {isAuthenticated ? <MainStackNav /> : <AuthStackNav />}
      </NavigationContainer>
    </Provider>
  );
}

export default App;

// Field: email (String)
// Field: username (String)
// Field: registrationDate (Timestamp)
// Collection: Purchases
// Document ID: Auto-generated or custom ID for each purchase
// Field: itemName (String)
// Field: description (String, optional)
// Field: regularPrice (Number)
// Field: markdownPrices (Array of Numbers)
// Field: paidPrice (Number)
// Field: purchaseDate (Date or Timestamp)
// Field: entryDate (Timestamp, set to the current time when saving)
// Field: imageUrl (String, optional)

// npm start
