import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRequireAuth } from '../hooks/useRequireAuth';

type RootStackParamList = {
  Swipe: { mode: 'freestyle' | 'longform' };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Swipe'>;

export default function Challenge() {
  useRequireAuth();
  const navigation = useNavigation<NavigationProp>();

  const handleSelectMode = (mode: 'freestyle' | 'longform') => {
    navigation.navigate('Swipe' as never, { mode } as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fight</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectMode('freestyle')}
      >
        <Text style={styles.emoji}>🥊</Text>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Freestyle Fightin’</Text>
          <Text style={styles.cardDesc}>5 minutes countdown for each turn</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectMode('longform')}
      >
        <Text style={styles.emoji}>🌊</Text>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Longform Lyrical Assault</Text>
          <Text style={styles.cardDesc}>
            12 hours total battle length.{"\n"}Write 16 bars then pass the mic to the opponent
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cardDesc: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
});
