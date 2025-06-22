import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

type Params = {
  ChallengeConfirm: {
    opponent: string;
    avatar_url: string | null;
    mode: 'freestyle' | 'longform';
  };
};

export default function ChallengeConfirmScreen() {
  const route = useRoute<RouteProp<Params, 'ChallengeConfirm'>>();
  const navigation = useNavigation();
  const { opponent, avatar_url, mode } = route.params;

  const handleConfirm = () => {
    navigation.navigate('BattleRoom', { opponent, mode });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ready to Challenge?</Text>

      <Image
        source={{ uri: avatar_url || 'https://placehold.co/100x100/png' }}
        style={styles.avatar}
      />
      <Text style={styles.opponent}>{opponent}</Text>
      <Text style={styles.mode}>
        Mode: {mode === 'freestyle' ? '🔥 Freestyle' : '🌊 Longform'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Start Battle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  opponent: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mode: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff6600',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
