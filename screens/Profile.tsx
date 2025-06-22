import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const defaultAvatar =
  'https://ui-avatars.com/api/?name=User&background=random&size=128';

export default function Profile() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'profile'>('signIn');

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const id = data.user.id;
        setUserId(id);
        setEmail(data.user.email || '');
        setMode('profile');

        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', id)
          .single();

        if (profile) {
          setUsername(profile.username || '');
          setAvatarUrl(profile.avatar_url || null);
        }
      }
    };

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setMode('signIn');
      }
      if (event === 'SIGNED_IN' && session?.user) {
        setMode('profile');
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    setLoading(true);

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle();

    if (existingUser) {
      Alert.alert('Username Taken', 'Please choose a different username.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert('Check your email to confirm your sign-up.');
    }

    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign In Error', error.message);
    } else {
      const id = data.user.id;
      setUserId(id);
      setMode('profile');
      setEmail(data.user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', id)
        .single();

      if (profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url || null);
      }
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!userId || !username.trim()) return;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .neq('id', userId)
      .maybeSingle();

    if (existingUser) {
      Alert.alert('Username Taken', 'Please choose a different username.');
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      username: username.trim(),
      avatar_url: avatarUrl,
    });

    if (error) {
      Alert.alert('Update Failed', error.message);
    } else {
      Alert.alert('Profile updated');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setAvatarUrl(null);
    setMode('signIn');
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0 && userId) {
      const original = result.assets[0];
      const size = Math.min(original.width!, original.height!);

      const manipResult = await ImageManipulator.manipulateAsync(
        original.uri,
        [
          {
            crop: {
              originX: (original.width! - size) / 2,
              originY: (original.height! - size) / 2,
              width: size,
              height: size,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const filePath = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(manipResult.base64!), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        Alert.alert('Upload Failed', uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      {mode === 'profile' && (
        <TouchableOpacity onPress={pickAvatar}>
          <Image
            source={{ uri: avatarUrl || defaultAvatar }}
            style={styles.avatar}
          />
          <Text style={styles.link}>Change Avatar</Text>
        </TouchableOpacity>
      )}

      {(mode === 'signIn' || mode === 'signUp') && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}

      {mode === 'signUp' && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
      )}

      {mode === 'signIn' && (
        <>
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode('signUp')}>
            <Text style={styles.link}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'signUp' && (
        <>
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('signIn')}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'profile' && (
        <>
          <Text style={styles.label}>Email (read-only)</Text>
          <Text style={styles.readonly}>{email}</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.link}>Log Out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  header: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFD700',
    alignSelf: 'center',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#111',
    color: 'white',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  readonly: {
    color: '#aaa',
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#ff6600',
    padding: 14,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  link: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  label: {
    color: '#ccc',
    marginTop: 20,
    marginBottom: 4,
  },
});
