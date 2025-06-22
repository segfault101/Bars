import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { findOrCreateMatch } from '../lib/findOrCreateMatch';
import { supabase } from '../lib/supabase';

export default function Challenge() {
  useRequireAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          const { data: session } = await supabase.auth.getSession();
          await supabase.from('queue').delete().eq('user_id', session.user?.id);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleStartBattle = async (mode: 'freestyle' | 'longform') => {
    try {
      setLoading(true);
      const matchId = await findOrCreateMatch(mode);

      const { data: session } = await supabase.auth.getUser();
      const myId = session.user?.id;

      if (matchId) {
        const { data: battle, error: battleError } = await supabase
          .from('battles')
          .insert({ player1: myId, player2: matchId, mode })
          .select()
          .single();

        if (battleError || !battle?.id) {
          Alert.alert('Error creating battle');
          return;
        }

        navigation.navigate('BattleRoom', { battleId: battle.id, mode });
      } else {
        setQueueing(true);

        pollRef.current = setInterval(async () => {
          // 1. Check for existing battle involving this user
          const { data: existingBattle } = await supabase
            .from('battles')
            .select('*')
            .or(`player1.eq.${myId},player2.eq.${myId}`)
            .eq('mode', mode)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingBattle?.id) {
            clearInterval(pollRef.current!);
            navigation.navigate('BattleRoom', { battleId: existingBattle.id, mode });
            return;
          }

          // 2. Check queue for a match
          const { data: match } = await supabase
            .from('queue')
            .select('user_id')
            .neq('user_id', myId)
            .eq('mode', mode)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (match?.user_id) {
            clearInterval(pollRef.current!);

            await supabase.from('queue').delete().in('user_id', [match.user_id, myId]);

            const { data: battle, error: battleError } = await supabase
              .from('battles')
              .insert({ player1: myId, player2: match.user_id, mode })
              .select()
              .single();

            if (battleError || !battle?.id) {
              Alert.alert('Error creating battle');
              return;
            }

            navigation.navigate('BattleRoom', { battleId: battle.id, mode });
          }
        }, 3000);


      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelQueue = async () => {
    setQueueing(false);
    if (pollRef.current) clearInterval(pollRef.current);
    const { data: session } = await supabase.auth.getUser();
    await supabase.from('queue').delete().eq('user_id', session.user?.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join the Queue</Text>

      {!queueing && (
        <>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleStartBattle('freestyle')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🎤 Freestyle Battle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => handleStartBattle('longform')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🧐 Longform Battle</Text>
          </TouchableOpacity>
        </>
      )}

      {queueing && (
        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <ActivityIndicator color="#ff6600" />
          <Text style={styles.waiting}>Waiting for an opponent...</Text>

          <TouchableOpacity onPress={cancelQueue} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
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
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff6600',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waiting: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 12,
  },
  cancelText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
