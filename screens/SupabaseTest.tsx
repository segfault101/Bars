import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import uuid from 'react-native-uuid';

export default function SupabaseTest() {
  const [status, setStatus] = useState('Testing rounds...');

  useEffect(() => {
    const testRounds = async () => {
      try {
        // 🔸 create fake battle ID
        const battleId = uuid.v4() as string;

        // 🔸 insert fake battle (just to satisfy FK constraint, if enforced)
        await supabase.from('battles').insert({
          id: battleId,
          player1: 'test_user',
          player2: 'bot',
          mode: 'freestyle',
        });

        // 🔸 insert a round
        const { error: insertError } = await supabase.from('rounds').insert({
          battle_id: battleId,
          author: 'test_user',
          bars: 'This is a test bar from SupabaseTest.tsx',
        });

        if (insertError) {
          setStatus(`Insert into rounds failed: ${insertError.message}`);
          return;
        }

        // 🔸 read back a round
        const { data, error: readError } = await supabase
          .from('rounds')
          .select('*')
          .eq('battle_id', battleId);

        if (readError) {
          setStatus(`Read from rounds failed: ${readError.message}`);
        } else {
          setStatus(`✅ Rounds access OK: ${data.length} round(s) found`);
        }
      } catch (err: any) {
        setStatus(`Unexpected error: ${err.message}`);
      }
    };

    testRounds();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});
