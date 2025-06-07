import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import uuid from 'react-native-uuid';

const placeholderAvatar = 'https://placehold.co/100x100/png';

type BattleRoomParams = {
  BattleRoom: {
    mode: 'freestyle' | 'longform';
    opponent: string;
  };
};

type Round = {
  author: 'you' | 'opponent';
  bars: string;
};

export default function BattleRoom() {
  const route = useRoute<RouteProp<BattleRoomParams, 'BattleRoom'>>();
  const navigation = useNavigation<any>();
  const { mode, opponent } = route.params;

  const [battleId, setBattleId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [barText, setBarText] = useState('');
  const [timer, setTimer] = useState(mode === 'freestyle' ? 300 : 43200);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [loading, setLoading] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const player = 'You'; // Hardcoded

  useEffect(() => {
    const initBattle = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('battles')
        .select('id')
        .eq('player1', player)
        .eq('player2', opponent)
        .eq('mode', mode)
        .limit(1)
        .maybeSingle();

      if (error) console.error('Fetch battle error:', error);

      let id = data?.id;
      if (!id) {
        const { data: newBattle, error: createErr } = await supabase
          .from('battles')
          .insert({
            id: uuid.v4() as string,
            player1: player,
            player2: opponent,
            mode,
          })
          .select()
          .single();

        if (createErr) console.error('Create battle error:', createErr);
        id = newBattle?.id;
      }

      setBattleId(id);
      setIsMyTurn((data?.id || rounds.length) % 2 !== 0);
    };

    initBattle();
  }, [mode, opponent]);

  useEffect(() => {
    if (!battleId) return;

    const loadRounds = async () => {
      const { data, error } = await supabase
        .from('rounds')
        .select('author, bars')
        .eq('battle_id', battleId)
        .order('created_at', { ascending: true });

      if (error) console.error('Load rounds error:', error);
      else setRounds(data || []);
      setLoading(false);
    };

    loadRounds();
  }, [battleId]);

  useEffect(() => {
    if (!isMyTurn || rounds.length >= 8) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, rounds.length]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handlePassMic = async () => {
    if (!barText.trim() || !battleId || rounds.length >= 8) return;

    const newRound = {
      battle_id: battleId,
      author: 'you',
      bars: barText.trim(),
    };

    const { error } = await supabase.from('rounds').insert(newRound);
    if (error) console.error('Submit round error:', error);
    else {
      const updatedRounds = [...rounds, { author: 'you', bars: barText.trim() }];
      setRounds(updatedRounds);
      setBarText('');
      scrollViewRef.current?.scrollToEnd({ animated: true });

      if (updatedRounds.length >= 8) {
        await supabase
          .from('battles')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', battleId);
        navigation.navigate('Voting', { battleId });
        return;
      }

      setIsMyTurn(false);

      setTimeout(async () => {
        const opponentLine = `Response from ${opponent}...`;
        const oppRound = {
          battle_id: battleId,
          author: 'opponent',
          bars: opponentLine,
        };
        await supabase.from('rounds').insert(oppRound);
        setRounds((prev) => {
          const nextRounds = [...prev, { author: 'opponent', bars: opponentLine }];
          if (nextRounds.length >= 8) {
            navigation.navigate('Voting', { battleId });
          }
          return nextRounds;
        });
        scrollViewRef.current?.scrollToEnd({ animated: true });
        setIsMyTurn(true);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff6600" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Battle...</Text>
      </View>
    );
  }

  const battleComplete = rounds.length >= 8;

  return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={'padding'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.header}>VS {opponent}</Text>
          <Image
            source={{ uri: placeholderAvatar }}
            style={styles.avatar}
          />
          <Text style={styles.subheader}>
            {battleComplete ? '✅ Battle Complete' : isMyTurn ? '🎤 Your Turn' : '⏳ Waiting for opponent…'}
          </Text>
          {!battleComplete && <Text style={styles.timer}>{formatTime(timer)}</Text>}

          <View style={{ flexGrow: 1 }}>
            {rounds.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.roundBubble,
                  item.author === 'you' ? styles.yourBubble : styles.oppBubble,
                ]}
              >
                <Text style={styles.authorLabel}>
                  {item.author === 'you' ? 'You' : opponent}
                </Text>
                <Text style={styles.roundText}>{item.bars}</Text>
              </View>
            ))}
          </View>

          {!battleComplete && isMyTurn && (
            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Write your bars here..."
                placeholderTextColor="#666"
                value={barText}
                onChangeText={setBarText}
              />
              <TouchableOpacity style={styles.button} onPress={handlePassMic}>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  subheader: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  timer: {
    color: '#ff6600',
    fontSize: 16,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    alignSelf: 'center',
  },
  historyContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  roundBubble: {
    marginVertical: 5,
    padding: 12,
    borderRadius: 10,
  },
  yourBubble: {
    backgroundColor: '#222',
    alignSelf: 'flex-end',
    maxWidth: '97%',
  },
  oppBubble: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    maxWidth: '97%',
  },
  authorLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  roundText: {
    color: '#fff',
    fontSize: 16,
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 20 : 30,
    backgroundColor: '#000',
  },
  input: {
    backgroundColor: '#111',
    color: 'white',
    borderRadius: 8,
    padding: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#ff6600',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scroll: {
  flex: 1,
  },
  scrollContainer: {
  flexGrow: 1,
  justifyContent: 'flex-start',
  backgroundColor: '#000',
  paddingBottom: 40,
  },
});
