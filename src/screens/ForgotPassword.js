import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import auth from '@react-native-firebase/auth';
import CustomButton from '../components/button';
import { useTheme } from '../theme/themeContext';
import CustomInput from '../components/customInput';

const ForgotPasswordScreen = ({ navigation }) => {
  const colors = useTheme();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async () => {
    try {
      await auth().sendPasswordResetEmail(email);
      setMessage('Check your email for a reset link.');
      setError(null);
    } catch (err) {
      setError(err.message);
      setMessage(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.subtitle}>Enter your email and we’ll send you a reset link.</Text>

      <CustomInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        type="email-address"
        autoCapitalize="none"
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.success}>{message}</Text>}

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
      fontSize: 14,
      color: colors.gray,
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.lightGrey,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    error: { color: 'red', marginBottom: 8 },
    success: { color: 'green', marginBottom: 8 },
    back: {
      marginTop: 24,
      textAlign: 'center',
      color: colors.primary,
      fontWeight: '500',
    },
  });

export default ForgotPasswordScreen;
