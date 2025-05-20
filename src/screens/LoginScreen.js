import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import auth from '@react-native-firebase/auth';
import CustomButton from '../components/button';
import CustomInput from '../components/customInput';
import Error from '../components/error';
import Logo from '../../assets/logo';
import { useTheme } from '../theme/themeContext';
import { useDispatch } from 'react-redux';
import { setUserOnboarded } from '../redux/actions/userActions';

const LoginScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch();

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
          navigation.navigate('Onboarding', {
            name: name,
            email: email,
            userId: userCredential.user.uid,
          });
          dispatch(setUserOnboarded(false));
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
          dispatch(setUserOnboarded(true));
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
        <CustomButton
          buttonStyle={styles.button}
          onPress={handleLogin}
          title={isSignUp ? 'Register' : 'Sign in'}
        />
        {/* <CustomButton onPress={() => navigation.navigate('Onboarding')} title={'ob'} /> */}
        {!isSignUp && (
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.link, { textAlign: 'center', marginTop: 12 }]}>
              Forgot password?
            </Text>
          </Pressable>
        )}
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

const createStyles = (colors) =>
  StyleSheet.create({
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
      gap: 8,
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
      fontWeight: 'bold',
    },
    subtitle: {
      color: colors.gray,
    },
    linkContainer: {
      position: 'absolute',
      flexDirection: 'row',
      gap: 4,
      justifyContent: 'center',
      bottom: 16,
      alignSelf: 'center',
    },
    button: {
      marginTop: 16,
    },
    bottomText: {
      color: colors.gray,
    },
    link: {
      color: colors.primary,
      fontWeight: '500',
    },
  });

export default LoginScreen;
