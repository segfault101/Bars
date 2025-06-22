import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useRequireAuth } from '../hooks/useRequireAuth';

export default function Battles() {
  useRequireAuth();
  const navigation = useNavigation();
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBattles = async () => {
      const { data: session } = await supabase.auth.getUser();
      const myId = session?.user?.id;

      if (!myId) return;

      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .or(`player1.eq.${myId},player2.eq.${myId}`)
        .order('created_at', { ascending: false });

      if (!error) setBattles(data || []);
      setLoading(false);
    };

    fetchBattles();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BattleRoom', { battleId: item.id, mode: item.mode })}
    >
      <Text style={styles.cardTitle}>Battle ID: {item.id}</Text>
      <Text style={styles.cardSubtitle}>Mode: {item.mode}</Text>
      <Text style={styles.cardSubtitle}>Started: {new Date(item.created_at).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#ff6600" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Battles</Text>
      <FlatList
        data={battles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#111', padding: 16, borderRadius: 10, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: '#aaa', fontSize: 14, marginTop: 4 },
});
