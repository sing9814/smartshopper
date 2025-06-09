import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import auth from '@react-native-firebase/auth';
import CustomButton from '../components/button';
import { useTheme } from '../theme/themeContext';
import CustomInput from '../components/customInput';
import Banner from '../components/banner';

const ForgotPasswordScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleReset = async () => {
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter a valid email.');
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email.trim());
      setErrorMessage('Check your email for a reset link.');
    } catch (err) {
      setErrorMessage(err.message);
    }
  };
  return (
    <View style={styles.container}>
      {typeof errorMessage === 'string' && errorMessage.length > 0 && (
        <Banner
          message={errorMessage}
          onFinish={() => setErrorMessage(null)}
          type={errorMessage.toLowerCase().includes('check your email') ? 'success' : 'error'}
        />
      )}

      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.subtitle}>Enter your email and we’ll send you a reset link.</Text>

      <CustomInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        type="email-address"
        autoCapitalize="none"
      />

      <CustomButton
        title="Send Reset Link"
        onPress={handleReset}
        buttonStyle={{ marginTop: 20 }}
        autoCapitalize="none"
      />

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>Back to Sign In</Text>
      </Pressable>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      padding: 20,
      justifyContent: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.black,
      marginBottom: 8,
    },
    subtitle: {
      color: colors.gray,
      marginBottom: 20,
    },
    error: {
      color: colors.red,
      marginBottom: 8,
    },
    success: {
      color: colors.green,
      marginBottom: 8,
    },
    back: {
      marginTop: 24,
      textAlign: 'center',
      color: colors.primary,
      fontWeight: '500',
    },
  });

export default ForgotPasswordScreen;
