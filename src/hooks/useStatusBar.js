import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { useCallback } from 'react';

export const useStatusBar = (backgroundColor) => {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(backgroundColor);
    }, [backgroundColor])
  );
};
