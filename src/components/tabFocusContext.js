// context/TabFocusContext.js
import React, { createContext, useContext } from 'react';

const TabFocusContext = createContext(0); // default active tab index

export const useTabFocus = (myIndex) => {
  const currentTabIndex = useContext(TabFocusContext);
  return currentTabIndex === myIndex;
};

export const TabFocusProvider = ({ index, children }) => {
  return <TabFocusContext.Provider value={index}>{children}</TabFocusContext.Provider>;
};
