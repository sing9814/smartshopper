import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Pressable } from 'react-native';
import auth from '@react-native-firebase/auth';
import CustomButton from '../components/button';
import CustomInput from '../components/textInput';
import Error from '../components/error';
import Logo from '../assets/logo';
import colors from '../utils/colors';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        setErrorMessage('Email or password is empty');
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Logo></Logo>
      </View>

      <View style={styles.innerContainer}>
        {errorMessage && <Error title={errorMessage}></Error>}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your details below</Text>
        </View>

        <CustomInput label="Email" value={email} onChangeText={setEmail} />
        <CustomInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <CustomButton onPress={handleLogin} title={'Sign in'} />

        <Pressable style={styles.linkContainer} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.bottomText}>Don't have an account?</Text>
          <Text style={styles.link}>Create one!</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 40,
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
    marginBottom: 16,
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
