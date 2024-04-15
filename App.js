import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import AuthStackNavigator from './navigation/AuthStackNavigator';
import MainTabNavigator from './navigation/MainTabNavigator';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setIsAuthenticated(user);
    });

    return unsubscribe; // Unsubscribe on unmount
  }, []);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
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
