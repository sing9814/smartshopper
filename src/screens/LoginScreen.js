import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Pressable } from 'react-native';
import auth from '@react-native-firebase/auth';
import CustomButton from '../components/button';
import CustomInput from '../components/textInput';
import Error from '../components/error';
import Logo from '../../assets/logo';
import colors from '../utils/colors';
import firestore from '@react-native-firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const resetStates = () => {
    setEmail('');
    setName('');
    setPassword('');
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    if (isSignUp) {
      try {
        if (!email || !name || !password) {
          setErrorMessage('Please fill in all fields');
        } else {
          const userCredential = await auth().createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;
          console.log(email, name);
          await firestore().collection('users').doc(user.uid).set({
            email: email,
            name: name,
            registrationDate: firestore.FieldValue.serverTimestamp(),
          });
          console.log('sucees');
        }
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      try {
        if (!email || !password) {
          setErrorMessage('Email or password is empty');
        } else {
          await auth().signInWithEmailAndPassword(email, password);
        }
      } catch (error) {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Logo></Logo>
      </View>

      <View style={styles.innerContainer}>
        <View style={[styles.textContainer, errorMessage == null && { marginBottom: 16 }]}>
          <Text style={styles.title}>{isSignUp ? 'Create an account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'To start tracking your spending!' : 'Enter your details below'}
          </Text>
        </View>
        {errorMessage && <Error title={errorMessage} margin={false}></Error>}

        <CustomInput label="Email" value={email} onChangeText={setEmail} />
        {isSignUp && <CustomInput label="Name" value={name} onChangeText={setName} />}

        <CustomInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <CustomButton onPress={handleLogin} title={isSignUp ? 'Register' : 'Sign in'} />

        <Pressable
          style={styles.linkContainer}
          onPress={() => [setIsSignUp(!isSignUp), resetStates()]}
        >
          <Text style={styles.bottomText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <Text style={styles.link}>{isSignUp ? 'Sign in' : 'Create one!'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  innerContainer: {
    height: '80%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 36,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    gap: 16,
  },
  logo: {
    alignItems: 'center',
    marginTop: '6%',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 5,
    // marginBottom: 16,
  },
  title: {
    color: colors.black,
    fontSize: 24,
    fontWeight: '500',
  },
  subtitle: {
    color: 'gray',
  },
  linkContainer: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    bottom: 16,
    alignSelf: 'center',
  },
  bottomText: {
    color: 'gray',
  },
  link: {
    color: colors.primary,
    fontWeight: '500',
  },
});

export default LoginScreen;
