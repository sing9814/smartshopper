import React from 'react';
import { View, Text, Button } from 'react-native';
import auth from '@react-native-firebase/auth';

const ProfileScreen = () => {
  const handleSignOut = async () => {
    auth().signOut();
  };

  return (
    <View>
      <Text>{auth().currentUser.email}</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
};

export default ProfileScreen;
