import React from 'react';
import { Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  blackText: {
    color: 'black',
  },
});

const BlackText = (props) => {
  return <Text {...props} style={[styles.blackText, props.style]} />;
};

Text.defaultProps = {
  ...Text.defaultProps,
  TextComponent: BlackText,
};

export default BlackText;
