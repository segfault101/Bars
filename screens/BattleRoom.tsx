import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator, Image,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useRequireAuth } from '../hooks/useRequireAuth';

export default function BattleRoom() {
  useRequireAuth();
  const route = useRoute<RouteProp<any, 'BattleRoom'>>();
  const navigation = useNavigation<any>();
  const { battleId, mode } = route.params;

  const [rounds, setRounds] = useState<any[]>([]);
  const [barText, setBarText] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [player1Id, setPlayer1Id] = useState<string | null>(null);
  const [timer, setTimer] = useState(mode === 'freestyle' ? 300 : 43200);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [opponentProfile, setOpponentProfile] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const updateTurn = (updatedRounds: any[]) => {
    if (!myId || !player1Id) return;
    if (updatedRounds.length === 0) {
      const isMyTurnFirst = myId === player1Id;
      setIsMyTurn(isMyTurnFirst);
      return;
    }
    const isEven = updatedRounds.length % 2 === 0;
    const amPlayer1 = myId === player1Id;
    setIsMyTurn((amPlayer1 && isEven) || (!amPlayer1 && !isEven));
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: session } = await supabase.auth.getUser();
      const myId = session?.user?.id;
      setMyId(myId);

      if (!myId) {
        Alert.alert('Error', 'Not logged in.');
        navigation.navigate('Profile');
        return;
      }

      const { data: battle } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single();

      if (!battle) {
        setLoading(false);
        Alert.alert('Error', 'No battle found.');
        navigation.goBack();
        return;
      }

      const player1Id = battle.player1;
      setPlayer1Id(player1Id);
      const player2Id = battle.player2;
      const isPlayer1 = myId === player1Id;

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', myId)
        .single();

      const opponentId = isPlayer1 ? player2Id : player1Id;
      const { data: oppProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', opponentId)
        .single();

      if (!myProfile || !oppProfile) {
        setLoading(false);
        Alert.alert('Error', 'Missing profile data.');
        navigation.navigate('Profile');
        return;
      }

      setMyProfile(myProfile);
      setOpponentProfile(oppProfile);
    };

    fetchProfiles();
  }, [battleId]);

  useEffect(() => {
    const fetchRounds = async () => {
      const { data } = await supabase
        .from('rounds')
        .select('author, bars')
        .eq('battle_id', battleId)
        .order('created_at', { ascending: true });

      setRounds(data || []);
      setTimeout(() => updateTurn(data || []), 100);
      setLoading(false);
    };

    fetchRounds();
  }, [battleId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isMyTurn && rounds.length < 8) {
      interval = setInterval(() => {
        setTimer((prev) => (prev <= 0 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMyTurn, rounds.length]);

  useEffect(() => {
    if (!battleId || !myProfile?.username) return;
    let poll: NodeJS.Timeout | null = null;

    if (!isMyTurn) {
      poll = setInterval(async () => {
        const { data } = await supabase
          .from('rounds')
          .select('author, bars')
          .eq('battle_id', battleId)
          .order('created_at', { ascending: true });

        if (!data) return;

        const last = data[data.length - 1];
        const alreadySeen = rounds.some((r) => r.author === last?.author && r.bars === last?.bars);

        if (!alreadySeen && last?.author !== myProfile.username) {
          setRounds(data);
          setTimeout(() => updateTurn(data), 100);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 3000);
    }

    return () => {
      if (poll) clearInterval(poll);
    };
  }, [isMyTurn, battleId, myProfile?.username]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!barText.trim() || rounds.length >= 8) return;

    await supabase.from('rounds').insert({
      battle_id: battleId,
      author: myProfile.username,
      bars: barText.trim(),
    });

    setRounds((prev) => {
      const updated = [...prev, { author: myProfile.username, bars: barText.trim() }];
      updateTurn(updated);
      return updated;
    });
    setBarText('');
    scrollViewRef.current?.scrollToEnd({ animated: true });

    if (rounds.length + 1 >= 8) {
      await supabase.from('battles')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', battleId);
      navigation.navigate('Voting', { battleId });
      return;
    }
  };

  if (loading || !myProfile || !opponentProfile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#ff6600" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading battle...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scroll} ref={scrollViewRef}>
          <View style={styles.container}>
            <Text style={styles.header}>Battle Started</Text>
            <Image source={{ uri: opponentProfile.avatar_url }} style={styles.avatar} />
            <Text style={styles.subheader}>{isMyTurn ? '🎤 Your Turn' : '⏳ Waiting for opponent...'}</Text>
            <Text style={styles.timer}>{formatTime(timer)}</Text>

            {rounds.map((r, i) => (
              <View
                key={i}
                style={[styles.bubble, r.author === myProfile.username ? styles.myBubble : styles.oppBubble]}
              >
                <Text style={styles.author}>{r.author}</Text>
                <Text style={styles.bars}>{r.bars}</Text>
              </View>
            ))}

            {isMyTurn && rounds.length < 8 && (
              <View style={styles.inputArea}>
                <TextInput
                  value={barText}
                  onChangeText={setBarText}
                  style={styles.input}
                  multiline
                  placeholder="Spit your bars..."
                  placeholderTextColor="#666"
                />
                <TouchableOpacity onPress={handleSubmit} style={styles.button}>
                  <Text style={styles.buttonText}>Pass the Mic</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  scroll: { flexGrow: 1 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subheader: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 8 },
  timer: { color: '#ff6600', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#FFD700', alignSelf: 'center', marginBottom: 12 },
  bubble: { marginVertical: 6, padding: 12, borderRadius: 10, maxWidth: '90%' },
  myBubble: { backgroundColor: '#222', alignSelf: 'flex-end' },
  oppBubble: { backgroundColor: '#333', alignSelf: 'flex-start' },
  author: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  bars: { color: '#fff', fontSize: 16 },
  inputArea: { marginTop: 20 },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 8, padding: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  button: { backgroundColor: '#ff6600', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold' },
});
