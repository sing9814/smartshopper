import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Animated,
  Dimensions,
  Text,
  StyleSheet,
  TouchableHighlight,
  PanResponder,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import { formatDate } from '../utils/date';
import PurchaseList from './purchaseList';
import CustomInput from './textInput';
import AddButton from './addButton';

const BottomOverlay = ({ selectedDate, setSelectedDate, list, navigation }) => {
  const [name, setName] = useState('');

  const height = Dimensions.get('window').height * 0.5;
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    setName('');
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: height,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [selectedDate, height]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy !== 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        const newTranslateY = Math.max(0, Math.min(gestureState.dy, height));
        translateY.setValue(newTranslateY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > height / 2) {
          Animated.timing(translateY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setSelectedDate(null));
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.topContainer} {...panResponder.panHandlers}>
        <Text style={styles.title}>{selectedDate ? formatDate(selectedDate) : ''}</Text>
        <TouchableHighlight
          style={styles.x}
          onPress={() => setSelectedDate(null)}
          underlayColor={colors.lightGrey}
        >
          <Ionicons name={'close'} size={16} color={colors.white} />
        </TouchableHighlight>
      </View>
      <View style={styles.input}>
        <CustomInput
          label="Add item"
          value={name}
          onChangeText={setName}
          component={
            <AddButton
              onPress={() => [navigation.navigate('Add', { name: name }), setName('')]}
              size={20}
            />
          }
        />
      </View>
      <PurchaseList
        purchases={list}
        overlay
        onItemPress={(item) => navigation.navigate('Details', { purchase: item })}
        onItemLongPress={() => {}}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    height: '50%',
    padding: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 10,
  },
  topContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginLeft: 6,
  },
  x: {
    backgroundColor: 'gray',
    borderRadius: 50,
    height: 25,
    width: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    marginBottom: 12,
  },
});

export default BottomOverlay;
