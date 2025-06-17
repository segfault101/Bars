import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useRequireAuth } from '../hooks/useRequireAuth';

type RootStackParamList = {
  Voting: { battleId: string };
};

type Vote = {
  id: string;
  battle_id: string;
  voted_for: 'you' | 'opponent';
};

type Round = {
  author: 'you' | 'opponent';
  bars: string;
};

export default function VotingScreen() {
  useRequireAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'Voting'>>();
  const { battleId } = route.params;

  const [rounds, setRounds] = useState<Round[]>([]);
  const [youVotes, setYouVotes] = useState(0);
  const [opponentVotes, setOpponentVotes] = useState(0);
  const [votedFor, setVotedFor] = useState<'you' | 'opponent' | null>(null);
  const [votingOpen, setVotingOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        console.error('User fetch error:', error);
        setUser(false); // false = unauthenticated
      } else {
        setUser(session.user);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (user === null) return; // still loading user
    if (!user) {
      Alert.alert('Sign-in required', 'Please sign in to vote.');
      setLoading(false);
      return;
    }

    const fetchVotesAndRounds = async () => {
      setLoading(true);

      const { data: roundsData, error: roundsErr } = await supabase
        .from('rounds')
        .select('author, bars')
        .eq('battle_id', battleId)
        .order('created_at', { ascending: true });

      if (roundsErr) console.error(roundsErr);
      else setRounds(roundsData || []);

      const { data: voteData, error: voteErr } = await supabase
        .from('votes')
        .select('*')
        .eq('battle_id', battleId);

      if (voteErr) console.error(voteErr);
      else {
        const you = voteData?.filter((v) => v.voted_for === 'you').length || 0;
        const opp = voteData?.filter((v) => v.voted_for === 'opponent').length || 0;
        setYouVotes(you);
        setOpponentVotes(opp);

        const existing = voteData.find((v) => v.id === user.id);
        if (existing) {
          setVotedFor(existing.voted_for);
        }

        if (voteData.length >= 20) setVotingOpen(false);
      }

      const { data: battle, error: battleErr } = await supabase
        .from('battles')
        .select('ended_at')
        .eq('id', battleId)
        .single();

      if (!battleErr && battle?.ended_at) {
        const endedTime = new Date(battle.ended_at).getTime();
        const now = new Date().getTime();
        const diff = now - endedTime;
        if (diff >= 24 * 60 * 60 * 1000) {
          setVotingOpen(false);
        }
      }

      setLoading(false);
    };

    fetchVotesAndRounds();
  }, [battleId, user]);

  const handleVote = async (side: 'you' | 'opponent') => {
    if (!user) return;

    if (votedFor === side) {
      // Undo the vote
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('id', user.id)
        .eq('battle_id', battleId);

      if (error) {
        console.error('Undo vote error:', error);
        Alert.alert('Undo Vote Failed');
      } else {
        setVotedFor(null);
        if (side === 'you') setYouVotes((v) => v - 1);
        else setOpponentVotes((v) => v - 1);
      }
    } else {
      // Cast or switch vote
      const { error } = await supabase.from('votes').upsert({
        id: user.id,
        battle_id: battleId,
        voted_for: side,
      });

      if (error) {
        console.error('Vote error:', error);
        Alert.alert('Vote Failed');
      } else {
        // If switching votes, decrease the previous count
        if (votedFor === 'you') setYouVotes((v) => v - 1);
        else if (votedFor === 'opponent') setOpponentVotes((v) => v - 1);

        // Increase the new vote count
        if (side === 'you') setYouVotes((v) => v + 1);
        else setOpponentVotes((v) => v + 1);

        setVotedFor(side);
      }
    }
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff6600" />
        <Text style={styles.loadingText}>Loading battle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>VOTE</Text>

      <TouchableOpacity
        style={[
          styles.voteBox,
          votedFor === 'you' && styles.voted,
          !votingOpen && youVotes >= opponentVotes && styles.winner,
        ]}
        onPress={() => handleVote('you')}
        disabled={!votingOpen}
      >
        <Text style={styles.voteLabel}>You</Text>
        <Text style={styles.voteCount}>{youVotes}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.voteBox,
          votedFor === 'opponent' && styles.voted,
          !votingOpen && opponentVotes > youVotes && styles.winner,
        ]}
        onPress={() => handleVote('opponent')}
        disabled={!votingOpen}
      >
        <Text style={styles.voteLabel}>Opponent</Text>
        <Text style={styles.voteCount}>{opponentVotes}</Text>
      </TouchableOpacity>

      {!votingOpen ? (
        <Text style={styles.closed}>Voting is closed</Text>
      ) : votedFor ? (
        <Text style={styles.thanks}>Thanks for voting!</Text>
      ) : (
        <Text style={styles.tip}>Tap to vote</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  voteBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 30,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  voteLabel: {
    color: '#aaa',
    fontSize: 18,
    marginBottom: 6,
  },
  voteCount: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  voted: {
    borderColor: '#ff6600',
    backgroundColor: '#1a1a1a',
  },
  winner: {
    borderColor: '#00ff88',
  },
  thanks: {
    color: '#ff6600',
    textAlign: 'center',
    marginTop: 10,
  },
  tip: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  closed: {
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
  },
});
