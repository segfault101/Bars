import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function VotingScreen() {
  const route = useRoute<RouteProp<{ Voting: { battleId: string } }, 'Voting'>>();
  const { battleId } = route.params;

  const [loading, setLoading] = useState(true);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [tally, setTally] = useState<{ you: number; opponent: number }>({ you: 0, opponent: 0 });
    const [playerNames, setPlayerNames] = useState<{ you: string; opponent: string }>({ you: 'You', opponent: 'Opponent' });
  const [votingOpen, setVotingOpen] = useState(true);

  const handleVote = async (choice: 'you' | 'opponent') => {
    if (votedFor && votedFor === choice) return;

    if (votedFor && votedFor !== choice) {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      if (!userId) return;

      // Delete previous vote
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('battle_id', battleId)
        .eq('user_id', userId);

      if (deleteError) return;

      setTally((prev) => {
        const updated = { ...prev, [votedFor]: Math.max(0, prev[votedFor] - 1) };
        
        return updated;
      });
    }

    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;
    if (!userId) return;

    const { data: existingVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('battle_id', battleId)
      .eq('user_id', userId);

    if (existingVotes && existingVotes.length > 0) {
      setVotedFor(choice); // visual feedback only
      return;
    }

    const { error } = await supabase
      .from('votes')
      .insert({ battle_id: battleId, winner: choice, user_id: userId });

    if (!error) {
      setVotedFor(choice);
      setTally((prev) => {
        const updated = { ...prev, [choice]: prev[choice] + 1 };
        let current = prev[choice];
        const interval = setInterval(() => {
          current++;
          setAnimatedTally((curr) => ({ ...curr, [choice]: current }));
          if (current >= updated[choice]) clearInterval(interval);
        }, 50);
        return updated;
      });
    }
  };

  useEffect(() => {
    const fetchVotes = async () => {
      const [{ data: voteData, error: voteError }, { data: battleData, error: battleError }] = await Promise.all([
        supabase.from('votes').select('winner').eq('battle_id', battleId),
        supabase.from('battles').select('player1, player2').eq('id', battleId).single(),
      ]);

      if (voteData && !voteError) {
        const count = { you: 0, opponent: 0 };
        for (const vote of voteData) {
          if (vote.winner === 'you') count.you++;
          else if (vote.winner === 'opponent') count.opponent++;
        }
        setTally(count);
      }

      if (battleData && !battleError) {
        setPlayerNames({ you: battleData.player1, opponent: battleData.player2 });
      }

      if (battleData?.ended_at) {
        const endTime = new Date(battleData.ended_at);
        const now = new Date();
        const oneDayLater = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
        if (now > oneDayLater || (voteData && voteData.length >= 20)) {
          setVotingOpen(false);
        }
      }

      setLoading(false);
    };

    fetchVotes();
  }, [battleId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upvote your winner</Text>

      <TouchableOpacity style={[styles.row, votedFor === 'you' && styles.highlightRow]} onPress={() => votingOpen && handleVote('you')}>
  <Image
    source={{ uri: 'https://placehold.co/100x100/png' }}
    style={styles.avatar}
  />
  <Text style={styles.username}>@{playerNames.you}</Text>
  <View style={styles.voteBox}>
    <Text style={styles.arrow}>⬆</Text>
    <Text style={styles.count}>{tally.you}</Text>
  </View>
</TouchableOpacity>

      <TouchableOpacity style={[styles.row, votedFor === 'opponent' && styles.highlightRow]} onPress={() => votingOpen && handleVote('opponent')}>
  <Image
    source={{ uri: 'https://placehold.co/100x100/png' }}
    style={styles.avatar}
  />
  <Text style={styles.username}>@{playerNames.opponent}</Text>
  <View style={styles.voteBox}>
    <Text style={styles.arrow}>⬆</Text>
    <Text style={styles.count}>{tally.opponent}</Text>
  </View>
</TouchableOpacity>
      {!votingOpen ? (
        <Text style={styles.thanksText}>Voting is closed</Text>
      ) : votedFor && (
        <Text style={styles.thanksText}>Thanks for voting!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  highlightRow: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
  },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
  },
  voteBox: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  arrow: {
    color: '#fff',
    fontSize: 16,
  },
  count: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upvoteButton: {
    marginTop: 32,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upvoteText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  thanksText: {
    color: '#0f0',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});
