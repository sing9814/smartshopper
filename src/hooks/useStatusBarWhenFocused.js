import { useFocusEffect } from '@react-navigation/native';
import { useTabFocus } from '../components/tabFocusContext';
import { useCallback } from 'react';
import { StatusBar } from 'react-native';

export const useStatusBarWhenFullyFocused = (myTabIndex, color) => {
  const tabFocused = useTabFocus(myTabIndex);

  useFocusEffect(
    useCallback(() => {
      if (tabFocused) {
        StatusBar.setBarStyle('light-content');
        StatusBar.setBackgroundColor(color);
      }
    }, [tabFocused, color])
  );
};
