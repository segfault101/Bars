import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

type Mode = 'freestyle' | 'longform';
type RouteParams = { Swipe: { mode: Mode } };
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Swipe() {
  const route = useRoute<RouteProp<RouteParams, 'Swipe'>>();
  const { mode } = route.params;
  const navigation = useNavigation<any>();

  const [opponents, setOpponents] = useState<
    { username: string; avatar_url: string | null }[]
  >([]);
  const [index, setIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    const fetchOpponents = async () => {
      const { data: session } = await supabase.auth.getUser();
      const currentUserId = session.user?.id;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .neq('id', currentUserId); // exclude self

      if (!error) setOpponents(data || []);
    };

    fetchOpponents();
  }, []);

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-20deg', '0deg', '20deg'],
    extrapolate: 'clamp',
  });

  const cardStyle = {
    transform: [...pan.getTranslateTransform(), { rotate }],
  };

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const swipeOffScreen = (direction: 'left' | 'right') => {
    Animated.timing(pan, {
      toValue: {
        x: direction === 'left' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5,
        y: 0,
      },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      const opponent = opponents[index];

      if (direction === 'right') {
        navigation.navigate('ChallengeConfirm', {
          mode,
          opponent: opponent.username,
          avatar_url: opponent.avatar_url,
        });
      }

      pan.setValue({ x: 0, y: 0 });
      setIndex((prev) => prev + 1);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) swipeOffScreen('right');
        else if (gesture.dx < -120) swipeOffScreen('left');
        else resetPosition();
      },
    })
  ).current;

  const card = opponents[index];
  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.doneText}>No more opponents!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.modeText}>
        {mode === 'freestyle' ? '🔥 Freestyle Fightin’' : '🌊 Longform Poetic Assault'}
      </Text>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, cardStyle]}
      >
        {card.avatar_url && (
          <Image source={{ uri: card.avatar_url }} style={styles.avatar} />
        )}
        <Text style={styles.name}>{card.username}</Text>
        <Text style={styles.bar}>"Ready to battle?"</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modeText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  card: {
    width: '100%',
    height: 400,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD700',
    marginBottom: 16,
  },
  name: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bar: {
    color: '#ccc',
    fontSize: 18,
    fontStyle: 'italic',
  },
  doneText: {
    color: '#888',
    fontSize: 20,
    fontStyle: 'italic',
  },
});
