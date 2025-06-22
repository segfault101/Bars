import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function NewPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenDetected, setTokenDetected] = useState(false);

  useEffect(() => {
    const handleDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes('access_token')) {
        const { queryParams } = Linking.parse(initialUrl);
        if (queryParams?.access_token) {
          const { error } = await supabase.auth.setSession({
            access_token: queryParams.access_token,
            refresh_token: queryParams.refresh_token,
          });
          if (error) {
            Alert.alert('Session Error', error.message);
          } else {
            setTokenDetected(true);
          }
        }
      }
    };

    handleDeepLink();
  }, []);

  const handleUpdatePassword = async () => {
    if (!password.trim()) {
      Alert.alert('Please enter a new password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Update Error', error.message);
    } else {
      Alert.alert('Success', 'Your password has been updated.');
    }
  };

  if (!tokenDetected) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Waiting for token...</Text>
        <ActivityIndicator color="#ff6600" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Set New Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter new password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdatePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#111',
    color: 'white',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ff6600',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
